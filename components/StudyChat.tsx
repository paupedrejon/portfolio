"use client";

// Tipos para Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
} | undefined;

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { spaceGrotesk, outfit, jetbrainsMono } from "../app/fonts";
import APIKeyConfig from "./APIKeyConfig";
import ChatSidebar from "./ChatSidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import SectionBasedSchemaRenderer from "./SectionBasedSchemaRenderer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  MoonIcon,
  SunIcon,
  FileIcon,
  NotesIcon,
  TestIcon,
  ExerciseIcon,
  SendIcon,
  CheckIcon,
  XIcon,
  AlertIcon,
  BookIcon,
  LightbulbIcon,
  DownloadIcon,
  UploadIcon,
  QuestionIcon,
  SparkleIcon,
  StarIcon,
  TargetIcon,
  ZapIcon,
  FlagUKIcon,
  FlagFRIcon,
  FlagDEIcon,
  FlagITIcon,
  FlagPTIcon,
  FlagCNIcon,
  FlagJPIcon,
  FlagKRIcon,
  FlagCAIcon,
  FlagRUIcon,
} from "./Icons";
// react-icons imports
import {
  SiPython,
  SiJavascript,
  SiReact,
  SiGit,
  SiHtml5,
  SiTypescript,
  SiSwift,
  SiCplusplus,
} from "react-icons/si";
import {
  FaAtom,
  FaBook,
  FaHistory,
  FaFileContract,
  FaComments,
  FaHandshake,
  FaLandmark,
  FaBalanceScale,
  FaScroll,
  FaBookOpen,
  FaPenFancy,
  FaStethoscope,
  FaVolumeUp,
  FaStop,
  FaMicrophone,
} from "react-icons/fa";
import {
  MdPsychology,
  MdGavel,
  MdWork,
  MdDesignServices,
  MdMovie,
  MdAccountBalance,
  MdCalculate,
  MdFunctions,
  MdMenuBook,
  MdAutoAwesome,
  MdSpeed,
  MdPublic,
  MdGroups,
  MdRestaurant,
  MdLocalLibrary,
  MdPalette,
} from "react-icons/md";
import { 
  TbBrain, 
  TbMathFunction,
  TbAtom,
  TbCalculator,
  TbChartBar,
  TbFlask,
  TbDna,
  TbFileText,
  TbShield,
  TbBriefcase,
  TbChartLine,
  TbShoppingBag,
  TbBulb,
  TbUserStar,
  TbTrendingUp,
  TbBuildingStore,
  TbHistory,
  TbPaint,
  TbBook,
  TbWorld,
  TbUsers,
  TbUser,
  TbHeartbeat,
  TbHeart,
  TbPill,
  TbMicroscope,
  TbHospital,
  TbPencil,
  TbPhoto,
  TbBox,
  TbHome,
  TbMusic,
  TbShirt,
  TbBuilding,
} from "react-icons/tb";
import {
  HiCodeBracket,
  HiCpuChip, 
  HiUserGroup, 
  HiHeart, 
  HiPaintBrush,
  HiCircleStack,
  HiCalculator,
  HiAcademicCap,
  HiBriefcase,
  HiClock,
  HiPresentationChartBar,
  HiScale,
  HiArrowTrendingUp,
  HiDocumentText,
  HiSparkles,
  HiLightBulb,
  HiKey,
  HiGlobeAlt,
  HiChevronDown,
  HiChartBar,
  HiCube,
  HiLockClosed,
  HiCloud,
  HiWifi,
  HiCheck,
  HiXMark,
} from "react-icons/hi2";
import { calculateCost, formatCost, estimateTokens, CostEstimate, MODEL_PRICING } from "./costCalculator";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  type?: "message" | "notes" | "test" | "feedback" | "success" | "exercise" | "exercise_result" | "warning" | "level_selection";
  timestamp: Date;
  costEstimate?: CostEstimate;
  topic?: string; // Tema del mensaje si es selección de nivel
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
  topics?: string[];
  user_level?: number;  // Nivel del usuario (0-10) cuando se generó el test
}

interface Exercise {
  exercise_id: string;
  statement: string;
  expected_answer: string;
  hints: string[];
  points: number;
  difficulty: string;
  topics: string[];
  solution_steps: string[];
}

interface ExerciseCorrection {
  score: number;
  score_percentage: number;
  is_correct: boolean;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  detailed_analysis: string;
  correct_answer_explanation: string;
}

export default function StudyChat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Procesando...");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [exerciseAnswer, setExerciseAnswer] = useState<string>("");
  const [exerciseAnswerImage, setExerciseAnswerImage] = useState<string | null>(null);
  const [exerciseCorrection, setExerciseCorrection] = useState<ExerciseCorrection | null>(null);
  const exerciseImageInputRef = useRef<HTMLInputElement>(null);
  const [showAPIKeyConfig, setShowAPIKeyConfig] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ openai: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const currentChatIdRef = useRef<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newChatColor, setNewChatColor] = useState<string>("#6366f1");
  const [newChatIcon, setNewChatIcon] = useState<string>("chat");
  const userId = session?.user?.id || "";
  const [currentChatLevel, setCurrentChatLevel] = useState<{ topic: string; level: number } | null>(null);
  const [messageLevels, setMessageLevels] = useState<Record<string, { topic: string; level: number }>>({});
  const [learnedWordsCount, setLearnedWordsCount] = useState<number>(0);
  const [showInitialForm, setShowInitialForm] = useState(false);
  const [initialFormData, setInitialFormData] = useState<{
    level: number | null;
    learningGoal: string;
    timeAvailable: string;
  }>({
    level: null,
    learningGoal: "",
    timeAvailable: "",
  });
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const levelDropdownRef = useRef<HTMLDivElement>(null);
  const [showLearnedWordsModal, setShowLearnedWordsModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [learnedWordsList, setLearnedWordsList] = useState<Array<{
    word: string;
    translation: string;
    example?: string;
    romanization?: string;
    source?: string;
  }>>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Función helper para guardar una palabra aprendida (no usada actualmente)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const saveLearnedWord = async (
    word: string,
    translation: string,
    language: string,
    source: string,
    example?: string,
    romanization?: string
  ) => {
    if (!userId || !language || !isLanguageTopic(language) || !word.trim() || !translation.trim()) return;
    
    try {
      const response = await fetch("/api/study-agents/add-learned-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          language,
          word: word.trim(),
          translation: translation.trim(),
          source,
          example,
          romanization,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Recargar el conteo desde el backend para asegurar sincronización
        if (language) {
          loadLearnedWordsCount(language);
        }
        
        // Si hay actualización de nivel, actualizar el nivel del chat
        if (data.level_update && currentChatLevel && currentChatLevel.topic === language) {
          const levelData = data.level_update;
          interface LevelUpdate {
            new_level?: number;
            level?: number;
          }
          const newLevel = (levelData as LevelUpdate)?.new_level || (levelData as LevelUpdate)?.level;
          if (newLevel !== undefined) {
            const oldLevel = currentChatLevel.level;
            setCurrentChatLevel({
              topic: language,
              level: newLevel,
            });
            
            // Mostrar mensaje si subió de nivel
            if (newLevel > oldLevel) {
              console.log(`📊 Nivel actualizado: ${oldLevel} → ${newLevel}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error saving learned word:", error);
    }
  };
  
  // Función para detectar el tema de un mensaje
  const detectTopicFromMessage = (content: string): string | null => {
    const contentLower = content.toLowerCase();
    if (contentLower.includes("sql") || contentLower.includes("select") || contentLower.includes("from") || contentLower.includes("where")) {
      return "SQL";
    } else if (contentLower.includes("python") || contentLower.includes("def ") || contentLower.includes("import ")) {
      return "Python";
    } else if (contentLower.includes("javascript") || contentLower.includes("js") || contentLower.includes("function")) {
      return "JavaScript";
    } else if (contentLower.includes("react") || contentLower.includes("component") || contentLower.includes("jsx")) {
      return "React";
    } else if (contentLower.includes("japonés") || contentLower.includes("japones") || contentLower.includes("hiragana") || contentLower.includes("katakana") || contentLower.includes("kanji") || contentLower.includes("nihongo")) {
      return "Japonés";
    } else if (contentLower.includes("api") || contentLower.includes("apis") || contentLower.includes("endpoint") || contentLower.includes("rest")) {
      return "APIs";
    }
    return null;
  };
  
  // Función para calcular nivel basado en palabras aprendidas
  const calculateLevelFromWords = (wordCount: number): number => {
    if (wordCount < 25) return 0;
    if (wordCount < 50) return 1;
    if (wordCount < 75) return 2;
    if (wordCount < 100) return 3;
    if (wordCount < 150) return 4;
    if (wordCount < 200) return 5;
    if (wordCount < 300) return 6;
    if (wordCount < 500) return 7;
    if (wordCount < 700) return 8;
    if (wordCount < 900) return 9;
    return 10;
  };

  // Función para cargar el conteo de palabras aprendidas
  const loadLearnedWordsCount = async (language: string) => {
    if (!userId || !language || !isLanguageTopic(language)) return;
    
    try {
      const response = await fetch("/api/study-agents/get-learned-words-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, language }),
      });
      
      const data = await response.json();
      if (data.success) {
        const count = data.count || 0;
        setLearnedWordsCount(count);
        
        // Si es un idioma, actualizar el nivel basado en palabras aprendidas
        if (currentChatLevel && currentChatLevel.topic === language) {
          const calculatedLevel = calculateLevelFromWords(count);
          if (calculatedLevel !== currentChatLevel.level) {
            setCurrentChatLevel({
              topic: language,
              level: calculatedLevel,
            });
            
            // Actualizar el nivel en el backend
            const chatIdToUse = currentChatId || currentChatIdRef.current;
            if (chatIdToUse) {
              fetch("/api/study-agents/set-chat-level", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  chatId: chatIdToUse,
                  level: calculatedLevel,
                  topic: language,
                }),
              }).catch(err => console.error("Error updating level:", err));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading learned words count:", error);
    }
  };

  // Función para cargar las palabras aprendidas
  const loadLearnedWords = async (language: string) => {
    if (!userId || !language || !isLanguageTopic(language)) return;
    
    try {
      const response = await fetch("/api/study-agents/get-learned-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, language }),
      });
      
      const data = await response.json();
      if (data.success) {
        setLearnedWordsList(data.words || []);
      }
    } catch (error) {
      console.error("Error loading learned words:", error);
    }
  };
  
  // Función para cargar el nivel de una conversación
  const loadChatLevel = async (chatId: string) => {
    if (!userId || !chatId) return;
    
    try {
      const response = await fetch("/api/study-agents/get-chat-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, chatId }),
      });
      
      const data = await response.json();
      if (data.success && data.progress) {
        const topic = data.progress.topic || currentChatLevel?.topic || "General";
        const level = data.progress.level || 0;
        setCurrentChatLevel({
          topic,
          level,
        });
        console.log(`📊 [Frontend] Nivel de conversación cargado: ${topic} - Nivel ${level}`);
        
        // Cargar conteo de palabras aprendidas si es un idioma
        if (isLanguageTopic(topic)) {
          await loadLearnedWordsCount(topic);
        } else {
          // Si no es un idioma, limpiar el conteo
          setLearnedWordsCount(0);
        }
        
        // Actualizar herramientas disponibles basándose en el tema
        // NO activar automáticamente flashcards al cargar nivel (solo si se solicita explícitamente)
        if (isLanguageTopic(topic)) {
          // Solo mostrar el botón, pero NO activar el componente automáticamente
          // El usuario debe hacer clic explícitamente en el botón de flashcards
          // setShowLanguageTool(true); // COMENTADO: No activar automáticamente
        } else if (isProgrammingLanguage(topic)) {
          setShowCodeTool(true);
        } else {
          // Para otros temas, ocultar herramientas por defecto
          // Se activarán si detectContextualTools las detecta
          setShowLanguageTool(false);
          setShowCodeTool(false);
        }
        
        return level;
      } else {
        // Si no hay progreso, mantener el tema actual si existe, o usar "General"
        const existingTopic = currentChatLevel?.topic || "General";
        setCurrentChatLevel({ topic: existingTopic, level: 0 });
        console.log(`📊 [Frontend] No hay progreso, usando tema: ${existingTopic}`);
        return 0;
      }
    } catch (error) {
      console.error("Error loading chat level:", error);
      return 0;
    }
  };
  
  // Función para cargar el nivel de un mensaje específico
  const loadMessageLevel = async (messageId: string, content: string) => {
    if (!userId) return;
    
    const topic = detectTopicFromMessage(content);
    if (!topic) return;
    
    try {
      const response = await fetch("/api/study-agents/get-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, topic }),
      });
      
      const data = await response.json();
      if (data.success && data.progress && data.progress[topic]) {
        const level = data.progress[topic].level || 0;
        setMessageLevels(prev => ({
          ...prev,
          [messageId]: { topic, level }
        }));
      } else {
        setMessageLevels(prev => ({
          ...prev,
          [messageId]: { topic, level: 0 }
        }));
      }
    } catch (error) {
      console.error("Error loading message level:", error);
    }
  };

  // Cerrar el desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target as Node)) {
        setShowLevelDropdown(false);
      }
    };

    if (showLevelDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLevelDropdown]);

  // Colores disponibles para los chats (no usados actualmente)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const chatColors = [
    { name: "Morado", value: "#6366f1" },
    { name: "Azul", value: "#3b82f6" },
    { name: "Verde", value: "#10b981" },
    { name: "Amarillo", value: "#f59e0b" },
    { name: "Rojo", value: "#ef4444" },
    { name: "Rosa", value: "#ec4899" },
    { name: "Cian", value: "#06b6d4" },
    { name: "Naranja", value: "#f97316" },
    { name: "Índigo", value: "#8b5cf6" },
    { name: "Esmeralda", value: "#14b8a6" },
    { name: "Verde Lima", value: "#84cc16" },
    { name: "Magenta", value: "#d946ef" },
  ];

  // Iconos disponibles para los chats (no usados actualmente)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const chatIcons = [
    { name: "Chat", value: "chat" },
    { name: "Libro", value: "book" },
    { name: "Notas", value: "notes" },
    { name: "Objetivo", value: "target" },
    { name: "Estrella", value: "star" },
  ];

  // Mapa de iconos por nombre de sección
  const getSectionIcon = (sectionName: string) => {
    switch (sectionName) {
      case "Idiomas":
        return <HiGlobeAlt size={24} color="white" />;
      case "Programación":
        return <HiCodeBracket size={24} color="white" />;
      case "Ciencias y Matemáticas":
        return <FaAtom size={24} color="white" />;
      case "Oposiciones y Leyes":
        return <HiScale size={24} color="white" />;
      case "Negocios y Finanzas":
        return <HiArrowTrendingUp size={24} color="white" />;
      case "Humanidades e Historia":
        return <FaHistory size={24} color="white" />;
      case "Tecnología y Datos":
        return <HiCpuChip size={24} color="white" />;
      case "Habilidades Blandas":
        return <HiUserGroup size={24} color="white" />;
      case "Salud y Ciencias":
        return <HiHeart size={24} color="white" />;
      case "Diseño y Creatividad":
        return <HiPaintBrush size={24} color="white" />;
      default:
        return <FaBook size={24} color="white" />;
    }
  };

  // Función helper para detectar si es un idioma (mejorada para detectar cualquier idioma)
  const isLanguageTopic = (topic: string | null | undefined): boolean => {
    if (!topic) return false;
    const topicLower = topic.toLowerCase();
    
    // Lista de idiomas conocidos (expandida)
    const knownLanguages = [
      "inglés", "english", "francés", "francais", "alemán", "deutsch", "german",
      "italiano", "italian", "portugués", "portuguese", "chino", "mandarín", "simplificado", "chinese",
      "japonés", "japones", "japanese", "coreano", "korean", "catalán", "catalan",
      "ruso", "russian", "español", "spanish", "árabe", "arabic", "hindi",
      "turco", "turkish", "polaco", "polish", "griego", "greek", "holandés", "dutch",
      "sueco", "swedish", "noruego", "norwegian", "danés", "danish", "finlandés", "finnish",
      "checo", "czech", "rumano", "romanian", "húngaro", "hungarian", "búlgaro", "bulgarian",
      "croata", "croatian", "serbio", "serbian", "esloveno", "slovenian", "eslovaco", "slovak",
      "ucraniano", "ukrainian", "bielorruso", "belarusian", "hebreo", "hebrew", "tailandés", "thai",
      "vietnamita", "vietnamese", "indonesio", "indonesian", "malayo", "malay", "filipino", "tagalog"
    ];
    
    // Verificar si contiene algún idioma conocido
    if (knownLanguages.some(lang => topicLower.includes(lang))) {
      return true;
    }
    
    // Detectar patrones comunes de nombres de idiomas
    // Palabras clave que sugieren que es un idioma
    const languageKeywords = [
      "idioma", "language", "lengua", "vocabulario", "vocabulary",
      "gramática", "grammar", "aprender", "learn", "estudiar", "study"
    ];
    
    // Si el tema contiene palabras clave de idioma, probablemente es un idioma
    if (languageKeywords.some(keyword => topicLower.includes(keyword))) {
      // Verificar que no sea programación
      const programmingKeywords = ["python", "javascript", "java", "sql", "c++", "c#", "programación", "programming", "código", "code"];
      if (!programmingKeywords.some(keyword => topicLower.includes(keyword))) {
        return true;
      }
    }
    
    return false;
  };

  // Función helper para detectar si es un lenguaje de programación
  const isProgrammingLanguage = (topic: string | null | undefined): boolean => {
    if (!topic) return false;
    const topicLower = topic.toLowerCase();
    return topicLower.includes("python") ||
      topicLower.includes("javascript") || topicLower.includes("js") ||
      topicLower.includes("java") ||
      topicLower.includes("sql") ||
      topicLower.includes("typescript") ||
      topicLower.includes("c++") || topicLower.includes("cpp") ||
      topicLower.includes("react") ||
      topicLower.includes("html") || topicLower.includes("css") ||
      topicLower.includes("swift");
  };

  // Función para detectar contexto de herramientas basándose en mensajes recientes
  const detectContextualTools = useMemo(() => {
    if (!messages || messages.length === 0) return { hasSQL: false, hasProgramming: false, hasLanguage: false, detectedLanguage: null, detectedProgramming: null, explicitFlashcardRequest: false };
    
    // Analizar los últimos 10 mensajes para detectar contexto
    const recentMessages = messages.slice(-10);
    const combinedText = recentMessages.map(m => m.content).join(" ").toLowerCase();
    
    // Detectar SQL - SOLO si hay múltiples indicadores o mención explícita
    // Requiere al menos 2 de estos indicadores para evitar falsos positivos
    const sqlIndicators = [
      combinedText.includes("sql") && (combinedText.includes("query") || combinedText.includes("database") || combinedText.includes("select")),
      combinedText.includes("select") && combinedText.includes("from") && (combinedText.includes("where") || combinedText.includes("join")),
      combinedText.includes("create table") || combinedText.includes("insert into") || combinedText.includes("update ") || combinedText.includes("delete from"),
      combinedText.includes("sqlite") || combinedText.includes("mysql") || combinedText.includes("postgresql"),
    ];
    const hasSQL = sqlIndicators.some(indicator => indicator === true) || 
                   (combinedText.includes("sql") && (combinedText.includes("programming") || combinedText.includes("código") || combinedText.includes("code")));
    
    // Detectar lenguajes de programación - SOLO si hay contexto claro de programación
    // Requiere múltiples indicadores para evitar falsos positivos
    const programmingLanguages = {
      sql: hasSQL, // SQL ya está validado arriba
      python: (combinedText.includes("python") || combinedText.includes("def ") || combinedText.includes("import ")) && 
              (combinedText.includes("programming") || combinedText.includes("código") || combinedText.includes("code") || combinedText.includes("script")),
      javascript: (combinedText.includes("javascript") || combinedText.includes("js ") || combinedText.includes("function ") || combinedText.includes("const ") || combinedText.includes("let ")) &&
                  (combinedText.includes("programming") || combinedText.includes("código") || combinedText.includes("code") || combinedText.includes("script") || combinedText.includes("node")),
      java: combinedText.includes("java") && !combinedText.includes("javascript") && 
            (combinedText.includes("programming") || combinedText.includes("código") || combinedText.includes("code") || combinedText.includes("class ") || combinedText.includes("public ")),
    };
    
    const detectedProgramming = Object.entries(programmingLanguages).find(([, detected]) => detected === true)?.[0] || null;
    const hasProgramming = detectedProgramming !== null;
    
    // Detectar solicitudes explícitas de flashcards
    const flashcardKeywords = [
      "flashcard", "flash card", "flashcards", "tarjeta", "tarjetas", 
      "quiero flashcards", "muéstrame flashcards", "dame flashcards",
      "genera flashcards", "haz flashcards", "crea flashcards",
      "quiero tarjetas", "muéstrame tarjetas", "dame tarjetas"
    ];
    
    const explicitFlashcardRequest = flashcardKeywords.some(keyword => combinedText.includes(keyword));
    
    // Detectar idiomas - SOLO si hay contexto MUY claro de aprendizaje de idiomas
    // Requiere múltiples indicadores específicos para evitar falsos positivos
    const languageKeywords = [
      "inglés", "english", "francés", "francais", "alemán", "deutsch", "italiano", "italian",
      "portugués", "portuguese", "chino", "chinese", "japonés", "japanese", "coreano", "korean",
    ];
    
    // Palabras clave MÁS ESPECÍFICAS para evitar activaciones accidentales
    // Solo palabras directamente relacionadas con vocabulario y flashcards
    const languageContextKeywords = [
      "vocabulario", "vocabulary", "palabra", "word", "frase", "phrase", 
      "traducción", "translation", "traducir", "translate"
    ];
    
    // Solo activar si hay un idioma específico Y contexto muy específico de vocabulario
    // O si hay una solicitud explícita de flashcards
    const hasSpecificLanguage = languageKeywords.some(keyword => combinedText.includes(keyword));
    const hasLanguageContext = languageContextKeywords.some(keyword => combinedText.includes(keyword));
    // Hacer más estricto: requiere idioma + contexto específico + NO palabras genéricas que causan falsos positivos
    const hasLanguage = (hasSpecificLanguage && hasLanguageContext) || explicitFlashcardRequest;
    
    // Intentar detectar el idioma específico mencionado
    let detectedLanguage = null;
    if (hasLanguage) {
      const languageMap: Record<string, string> = {
        "inglés": "Inglés", "english": "Inglés",
        "francés": "Francés", "francais": "Francés",
        "alemán": "Alemán", "deutsch": "Alemán", "german": "Alemán",
        "italiano": "Italiano", "italian": "Italiano",
        "portugués": "Portugués", "portuguese": "Portugués",
        "chino": "Chino", "chinese": "Chino", "mandarín": "Chino",
        "japonés": "Japonés", "japanese": "Japonés", "japones": "Japonés",
        "coreano": "Coreano", "korean": "Coreano",
        "ruso": "Ruso", "russian": "Ruso",
      };
      
      for (const [key, value] of Object.entries(languageMap)) {
        if (combinedText.includes(key)) {
          detectedLanguage = value;
          break;
        }
      }
    }
    
    return { hasSQL, hasProgramming, hasLanguage, detectedLanguage, detectedProgramming, explicitFlashcardRequest };
  }, [messages]);

  // Estado para mostrar herramientas
  const [showLanguageTool, setShowLanguageTool] = useState(false);
  const [showCodeTool, setShowCodeTool] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Función para obtener el identificador del icono basado en el tema (para guardarlo en metadata)
  const getTopicIconIdentifier = (topic: string): string => {
    const topicLower = topic.toLowerCase();
    // Mapear temas a identificadores de iconos únicos
    if (isLanguageTopic(topic)) return `flag_${topicLower.replace(/\s+/g, "_")}`;
    if (topicLower.includes("python")) return "icon_python";
    if (topicLower.includes("javascript") || topicLower.includes("js")) return "icon_javascript";
    if (topicLower.includes("sql")) return "icon_sql";
    if (topicLower.includes("java")) return "icon_java";
    if (topicLower.includes("html") || topicLower.includes("css")) return "icon_html";
    if (topicLower.includes("react")) return "icon_react";
    if (topicLower.includes("c++") || topicLower.includes("cpp")) return "icon_cpp";
    if (topicLower.includes("git")) return "icon_git";
    if (topicLower.includes("typescript") || topicLower.includes("ts")) return "icon_typescript";
    if (topicLower.includes("swift")) return "icon_swift";
    if (topicLower.includes("cálculo") || topicLower.includes("calculo")) return "icon_calculo";
    if (topicLower.includes("álgebra") || topicLower.includes("algebra")) return "icon_algebra";
    if (topicLower.includes("estadística") || topicLower.includes("estadistica")) return "icon_estadistica";
    if (topicLower.includes("física") || topicLower.includes("fisica")) return "icon_fisica";
    if (topicLower.includes("química") || topicLower.includes("quimica")) return "icon_quimica";
    if (topicLower.includes("biología") || topicLower.includes("biologia")) return "icon_biologia";
    if (topicLower.includes("matemáticas") || topicLower.includes("matematicas") || topicLower.includes("matematica")) return "icon_matematicas";
    if (topicLower.includes("lógica") || topicLower.includes("logica")) return "icon_logica";
    if (topicLower.includes("geometría") || topicLower.includes("geometria")) return "icon_geometria";
    if (topicLower.includes("termodinámica") || topicLower.includes("termodinamica")) return "icon_termodinamica";
    if (topicLower.includes("constitución") || topicLower.includes("constitucion")) return "icon_constitucion";
    if (topicLower.includes("derecho administrativo")) return "icon_derecho_administrativo";
    if (topicLower.includes("derecho civil")) return "icon_derecho_civil";
    if (topicLower.includes("derecho tributario")) return "icon_derecho_tributario";
    if (topicLower.includes("derecho")) return "icon_derecho";
    if (topicLower.includes("estatuto")) return "icon_estatuto";
    if (topicLower.includes("código") || topicLower.includes("codigo")) return "icon_codigo";
    if (topicLower.includes("ley") && topicLower.includes("contratos")) return "icon_ley";
    if (topicLower.includes("protección") || topicLower.includes("proteccion")) return "icon_proteccion";
    if (topicLower.includes("oposiciones") || (topicLower.includes("administrativo") && !topicLower.includes("derecho"))) return "icon_oposiciones";
    if (topicLower.includes("fuerzas") || (topicLower.includes("cuerpos") && topicLower.includes("seguridad"))) return "icon_fuerzas";
    if (topicLower.includes("excel")) return "icon_excel";
    if (topicLower.includes("contabilidad")) return "icon_contabilidad";
    if (topicLower.includes("finanzas")) return "icon_finanzas";
    if (topicLower.includes("gestión") || topicLower.includes("gestion") || topicLower.includes("proyectos")) return "icon_gestion";
    if (topicLower.includes("marketing")) return "icon_marketing";
    if (topicLower.includes("comercio") || topicLower.includes("ecommerce") || topicLower.includes("electrónico")) return "icon_comercio";
    if (topicLower.includes("emprendimiento")) return "icon_emprendimiento";
    if (topicLower.includes("liderazgo")) return "icon_liderazgo";
    if (topicLower.includes("economía") || topicLower.includes("economia")) return "icon_economia";
    if (topicLower.includes("ventas")) return "icon_ventas";
    if (topicLower.includes("historia")) return "icon_historia";
    if (topicLower.includes("arte")) return "icon_arte";
    if (topicLower.includes("filosofía") || topicLower.includes("filosofia")) return "icon_filosofia";
    if (topicLower.includes("guerra") || topicLower.includes("mundial")) return "icon_guerra";
    if (topicLower.includes("moda") && topicLower.includes("historia")) return "icon_historia_moda";
    if (topicLower.includes("literatura")) return "icon_literatura";
    if (topicLower.includes("geografía") || topicLower.includes("geografia")) return "icon_geografia";
    if (topicLower.includes("mitología") || topicLower.includes("mitologia")) return "icon_mitologia";
    if (topicLower.includes("sociología") || topicLower.includes("sociologia")) return "icon_sociologia";
    if (topicLower.includes("antropología") || topicLower.includes("antropologia")) return "icon_antropologia";
    if (topicLower.includes("escritura") || topicLower.includes("creativa")) return "icon_escritura";
    if (topicLower.includes("inteligencia") || topicLower.includes("artificial") || topicLower.includes("ia") || topicLower.includes("ai")) return "icon_ia";
    if (topicLower.includes("prompt") || topicLower.includes("engineering")) return "icon_prompt";
    if (topicLower.includes("ciberseguridad")) return "icon_ciberseguridad";
    if (topicLower.includes("análisis") || topicLower.includes("analisis") || topicLower.includes("datos")) return "icon_datos";
    if (topicLower.includes("power bi") || topicLower.includes("powerbi")) return "icon_powerbi";
    if (topicLower.includes("blockchain")) return "icon_blockchain";
    if (topicLower.includes("cloud") || topicLower.includes("computing")) return "icon_cloud";
    if (topicLower.includes("automatización") || topicLower.includes("automatizacion")) return "icon_automatizacion";
    if (topicLower.includes("iot") || topicLower.includes("internet")) return "icon_iot";
    if (topicLower.includes("video") || topicLower.includes("edición") || topicLower.includes("edicion")) return "icon_video";
    if (topicLower.includes("hablar") || topicLower.includes("público") || topicLower.includes("publico")) return "icon_hablar";
    if (topicLower.includes("tiempo") || topicLower.includes("gestión")) return "icon_tiempo";
    if (topicLower.includes("emocional") || topicLower.includes("inteligencia")) return "icon_emocional";
    if (topicLower.includes("conflictos") || topicLower.includes("resolución")) return "icon_conflictos";
    if (topicLower.includes("crítico") || topicLower.includes("critico") || topicLower.includes("pensamiento")) return "icon_critico";
    if (topicLower.includes("estudio") || topicLower.includes("técnicas") || topicLower.includes("tecnicas")) return "icon_estudio";
    if (topicLower.includes("comunicación") || topicLower.includes("comunicacion") || topicLower.includes("asertiva")) return "icon_comunicacion";
    if (topicLower.includes("entrevistas") || topicLower.includes("trabajo")) return "icon_entrevistas";
    if (topicLower.includes("equipo")) return "icon_equipo";
    if (topicLower.includes("estrés") || topicLower.includes("estres") || topicLower.includes("gestión")) return "icon_estres";
    if (topicLower.includes("anatomía") || topicLower.includes("anatomia")) return "icon_anatomia";
    if (topicLower.includes("nutrición") || topicLower.includes("nutricion")) return "icon_nutricion";
    if (topicLower.includes("fisiología") || topicLower.includes("fisiologia")) return "icon_fisiologia";
    if (topicLower.includes("auxilios") || topicLower.includes("primeros")) return "icon_auxilios";
    if (topicLower.includes("psicología") || topicLower.includes("psicologia")) return "icon_psicologia";
    if (topicLower.includes("neurociencia") || topicLower.includes("neuro")) return "icon_neurociencia";
    if (topicLower.includes("farmacología") || topicLower.includes("farmacologia")) return "icon_farmacologia";
    if (topicLower.includes("genética") || topicLower.includes("genetica")) return "icon_genetica";
    if (topicLower.includes("microbiología") || topicLower.includes("microbiologia")) return "icon_microbiologia";
    if (topicLower.includes("salud pública") || topicLower.includes("salud publica")) return "icon_salud_publica";
    if (topicLower.includes("ux") || topicLower.includes("ui") || topicLower.includes("diseño")) return "icon_diseño";
    if (topicLower.includes("photoshop")) return "icon_photoshop";
    if (topicLower.includes("gráfico") || topicLower.includes("grafico")) return "icon_grafico";
    if (topicLower.includes("ilustración") || topicLower.includes("ilustracion")) return "icon_ilustracion";
    if (topicLower.includes("fotografía") || topicLower.includes("fotografia")) return "icon_fotografia";
    if (topicLower.includes("3d") || topicLower.includes("modelado")) return "icon_3d";
    if (topicLower.includes("interiores")) return "icon_interiores";
    if (topicLower.includes("música") || topicLower.includes("musica")) return "icon_musica";
    if (topicLower.includes("moda")) return "icon_moda";
    if (topicLower.includes("arquitectura")) return "icon_arquitectura";
    return "book"; // Default para temas no mapeados
  };

  // Mapa de iconos por tema individual
  const getTopicIcon = (topic: string) => {
    const topicLower = topic.toLowerCase();
    const isLanguage = isLanguageTopic(topic);
    const iconSize = isLanguage ? 48 : 40; // Tamaño más grande para banderas (llenar todo el contenedor)
    // Idiomas - Banderas específicas
    if (topicLower.includes("inglés") || topicLower.includes("english")) return <FlagUKIcon size={iconSize} />;
    if (topicLower.includes("francés") || topicLower.includes("francais")) return <FlagFRIcon size={iconSize} />;
    if (topicLower.includes("alemán") || topicLower.includes("deutsch")) return <FlagDEIcon size={iconSize} />;
    if (topicLower.includes("italiano")) return <FlagITIcon size={iconSize} />;
    if (topicLower.includes("portugués")) return <FlagPTIcon size={iconSize} />;
    if (topicLower.includes("chino") || topicLower.includes("mandarín") || topicLower.includes("simplificado")) return <FlagCNIcon size={iconSize} />;
    if (topicLower.includes("japonés") || topicLower.includes("japones")) return <FlagJPIcon size={iconSize} />;
    if (topicLower.includes("coreano")) return <FlagKRIcon size={iconSize} />;
    if (topicLower.includes("catalán") || topicLower.includes("catalan")) return <FlagCAIcon size={iconSize} />;
    if (topicLower.includes("ruso")) return <FlagRUIcon size={iconSize} />;
    // Programación - Iconos específicos de react-icons
    if (topicLower.includes("python")) return <SiPython size={iconSize} color="currentColor" />;
    if (topicLower.includes("javascript") || topicLower.includes("js")) return <SiJavascript size={iconSize} color="currentColor" />;
    if (topicLower.includes("sql") || topicLower === "sql") return <HiCircleStack size={iconSize} />;
    if (topicLower.includes("java")) return <HiCodeBracket size={iconSize} />;
    if (topicLower.includes("html") || topicLower.includes("css")) return <SiHtml5 size={iconSize} color="currentColor" />;
    if (topicLower.includes("react")) return <SiReact size={iconSize} color="currentColor" />;
    if (topicLower.includes("c++") || topicLower.includes("cpp")) return <SiCplusplus size={iconSize} color="currentColor" />;
    if (topicLower.includes("git")) return <SiGit size={iconSize} color="currentColor" />;
    if (topicLower.includes("typescript") || topicLower.includes("ts")) return <SiTypescript size={iconSize} color="currentColor" />;
    if (topicLower.includes("swift")) return <SiSwift size={iconSize} color="currentColor" />;
    // Ciencias y Matemáticas
    if (topicLower.includes("cálculo") || topicLower.includes("calculo")) return <TbCalculator size={iconSize} />;
    if (topicLower.includes("álgebra") || topicLower.includes("algebra")) return <TbMathFunction size={iconSize} />;
    if (topicLower.includes("estadística") || topicLower.includes("estadistica")) return <TbChartBar size={iconSize} />;
    if (topicLower.includes("física") || topicLower.includes("fisica")) return <TbAtom size={iconSize} />;
    if (topicLower.includes("química") || topicLower.includes("quimica")) return <TbFlask size={iconSize} />;
    if (topicLower.includes("biología") || topicLower.includes("biologia")) return <TbDna size={iconSize} />;
    if (topicLower.includes("matemáticas") || topicLower.includes("matematicas") || topicLower.includes("matematica")) return <HiCalculator size={iconSize} />;
    if (topicLower.includes("lógica") || topicLower.includes("logica")) return <TbBrain size={iconSize} />;
    if (topicLower.includes("geometría") || topicLower.includes("geometria")) return <MdFunctions size={iconSize} />;
    if (topicLower.includes("termodinámica") || topicLower.includes("termodinamica")) return <FaAtom size={iconSize} />;
    // Oposiciones y Leyes - Orden específico para evitar conflictos
    if (topicLower.includes("constitución") || topicLower.includes("constitucion")) return <FaBalanceScale size={iconSize} />;
    if (topicLower.includes("derecho administrativo")) return <FaLandmark size={iconSize} />;
    if (topicLower.includes("derecho civil")) return <FaBookOpen size={iconSize} />;
    if (topicLower.includes("derecho tributario")) return <MdAccountBalance size={iconSize} />;
    if (topicLower.includes("derecho")) return <MdGavel size={iconSize} />; // Fallback para otros tipos de derecho
    if (topicLower.includes("estatuto")) return <FaScroll size={iconSize} />;
    if (topicLower.includes("código") || topicLower.includes("codigo")) return <TbFileText size={iconSize} />;
    if (topicLower.includes("ley") && topicLower.includes("contratos")) return <FaFileContract size={iconSize} />;
    if (topicLower.includes("protección") || topicLower.includes("proteccion")) return <TbShield size={iconSize} />;
    if (topicLower.includes("oposiciones") || (topicLower.includes("administrativo") && !topicLower.includes("derecho"))) return <MdWork size={iconSize} />;
    if (topicLower.includes("fuerzas") || (topicLower.includes("cuerpos") && topicLower.includes("seguridad"))) return <HiLockClosed size={iconSize} />;
    // Negocios y Finanzas
    if (topicLower.includes("excel")) return <MdCalculate size={iconSize} />;
    if (topicLower.includes("contabilidad")) return <MdAccountBalance size={iconSize} />;
    if (topicLower.includes("finanzas")) return <TbChartLine size={iconSize} />;
    if (topicLower.includes("gestión") || topicLower.includes("gestion") || topicLower.includes("proyectos")) return <TbBriefcase size={iconSize} />;
    if (topicLower.includes("marketing")) return <TbTrendingUp size={iconSize} />;
    if (topicLower.includes("comercio") || topicLower.includes("ecommerce") || topicLower.includes("electrónico")) return <TbShoppingBag size={iconSize} />;
    if (topicLower.includes("emprendimiento")) return <TbBulb size={iconSize} />;
    if (topicLower.includes("liderazgo")) return <TbUserStar size={iconSize} />;
    if (topicLower.includes("economía") || topicLower.includes("economia")) return <HiArrowTrendingUp size={iconSize} />;
    if (topicLower.includes("ventas")) return <TbBuildingStore size={iconSize} />;
    // Humanidades e Historia
    if (topicLower.includes("moda") && topicLower.includes("historia")) return <TbShirt size={iconSize} />; // Historia de la Moda
    if (topicLower.includes("historia")) return <TbHistory size={iconSize} />;
    if (topicLower.includes("arte")) return <TbPaint size={iconSize} />;
    if (topicLower.includes("filosofía") || topicLower.includes("filosofia")) return <HiSparkles size={iconSize} />;
    if (topicLower.includes("guerra") || topicLower.includes("mundial")) return <HiDocumentText size={iconSize} />;
    if (topicLower.includes("literatura")) return <TbBook size={iconSize} />;
    if (topicLower.includes("geografía") || topicLower.includes("geografia")) return <TbWorld size={iconSize} />;
    if (topicLower.includes("mitología") || topicLower.includes("mitologia")) return <FaHistory size={iconSize} />;
    if (topicLower.includes("sociología") || topicLower.includes("sociologia")) return <TbUsers size={iconSize} />;
    if (topicLower.includes("antropología") || topicLower.includes("antropologia")) return <TbUser size={iconSize} />;
    if (topicLower.includes("escritura") || topicLower.includes("creativa")) return <FaPenFancy size={iconSize} />;
    // Tecnología y Datos
    if (topicLower.includes("inteligencia") || topicLower.includes("artificial") || topicLower.includes("ia") || topicLower.includes("ai")) return <MdAutoAwesome size={iconSize} />;
    if (topicLower.includes("prompt") || topicLower.includes("engineering")) return <HiCpuChip size={iconSize} />;
    if (topicLower.includes("ciberseguridad")) return <HiKey size={iconSize} />;
    if (topicLower.includes("análisis") || topicLower.includes("analisis") || topicLower.includes("datos")) return <HiChartBar size={iconSize} />;
    if (topicLower.includes("power bi") || topicLower.includes("powerbi")) return <HiCircleStack size={iconSize} />;
    if (topicLower.includes("blockchain")) return <HiCube size={iconSize} />;
    if (topicLower.includes("cloud") || topicLower.includes("computing")) return <HiCloud size={iconSize} />;
    if (topicLower.includes("automatización") || topicLower.includes("automatizacion")) return <MdSpeed size={iconSize} />;
    if (topicLower.includes("iot") || topicLower.includes("internet")) return <HiWifi size={iconSize} />;
    if (topicLower.includes("video") || topicLower.includes("edición") || topicLower.includes("edicion")) return <MdMovie size={iconSize} />;
    // Habilidades Blandas
    if (topicLower.includes("hablar") || topicLower.includes("público") || topicLower.includes("publico")) return <HiPresentationChartBar size={iconSize} />;
    if (topicLower.includes("tiempo") || topicLower.includes("gestión")) return <HiClock size={iconSize} />;
    if (topicLower.includes("emocional") || topicLower.includes("inteligencia")) return <MdPsychology size={iconSize} />;
    if (topicLower.includes("conflictos") || topicLower.includes("resolución")) return <FaHandshake size={iconSize} />;
    if (topicLower.includes("crítico") || topicLower.includes("critico") || topicLower.includes("pensamiento")) return <HiLightBulb size={iconSize} />;
    if (topicLower.includes("estudio") || topicLower.includes("técnicas") || topicLower.includes("tecnicas")) return <MdLocalLibrary size={iconSize} />;
    if (topicLower.includes("comunicación") || topicLower.includes("comunicacion") || topicLower.includes("asertiva")) return <FaComments size={iconSize} />;
    if (topicLower.includes("entrevistas") || topicLower.includes("trabajo")) return <HiBriefcase size={iconSize} />;
    if (topicLower.includes("equipo")) return <MdGroups size={iconSize} />;
    if (topicLower.includes("estrés") || topicLower.includes("estres") || topicLower.includes("gestión")) return <TbHeartbeat size={iconSize} />;
    // Salud y Ciencias
    if (topicLower.includes("anatomía") || topicLower.includes("anatomia")) return <TbHeart size={iconSize} />;
    if (topicLower.includes("nutrición") || topicLower.includes("nutricion")) return <MdRestaurant size={iconSize} />;
    if (topicLower.includes("fisiología") || topicLower.includes("fisiologia")) return <FaStethoscope size={iconSize} />;
    if (topicLower.includes("auxilios") || topicLower.includes("primeros")) return <TbHospital size={iconSize} />;
    if (topicLower.includes("psicología") || topicLower.includes("psicologia")) return <MdPsychology size={iconSize} />;
    if (topicLower.includes("neurociencia") || topicLower.includes("neuro")) return <TbBrain size={iconSize} />;
    if (topicLower.includes("farmacología") || topicLower.includes("farmacologia")) return <TbPill size={iconSize} />;
    if (topicLower.includes("genética") || topicLower.includes("genetica")) return <TbDna size={iconSize} />;
    if (topicLower.includes("microbiología") || topicLower.includes("microbiologia")) return <TbMicroscope size={iconSize} />;
    if (topicLower.includes("salud pública") || topicLower.includes("salud publica")) return <MdPublic size={iconSize} />;
    // Diseño y Creatividad
    if (topicLower.includes("ux") || topicLower.includes("ui") || topicLower.includes("diseño")) return <MdDesignServices size={iconSize} />;
    if (topicLower.includes("photoshop")) return <MdPalette size={iconSize} />;
    if (topicLower.includes("gráfico") || topicLower.includes("grafico")) return <HiPaintBrush size={iconSize} />;
    if (topicLower.includes("ilustración") || topicLower.includes("ilustracion")) return <TbPencil size={iconSize} />;
    if (topicLower.includes("fotografía") || topicLower.includes("fotografia")) return <TbPhoto size={iconSize} />;
    if (topicLower.includes("3d") || topicLower.includes("modelado")) return <TbBox size={iconSize} />;
    if (topicLower.includes("interiores")) return <TbHome size={iconSize} />;
    if (topicLower.includes("música") || topicLower.includes("musica")) return <TbMusic size={iconSize} />;
    if (topicLower.includes("moda")) return <TbShirt size={iconSize} />;
    if (topicLower.includes("arquitectura")) return <TbBuilding size={iconSize} />;
    // Default
    return <FaBook size={iconSize} />;
  };

  // Sugerencias organizadas por secciones (usando useMemo para evitar recrear en cada render)
  const topicSuggestions = useMemo(() => [
    {
      name: "Idiomas",
      color: "#3b82f6",
      topics: ["Inglés", "Francés", "Alemán", "Italiano", "Portugués", "Chino Simplificado", "Japonés", "Coreano", "Catalán", "Ruso"],
    },
    {
      name: "Programación",
      color: "#10b981",
      topics: ["Python", "JavaScript", "SQL", "Java", "HTML5 y CSS3", "React", "C++", "Git", "TypeScript", "Swift"],
    },
    {
      name: "Ciencias y Matemáticas",
      color: "#f59e0b",
      topics: ["Cálculo", "Álgebra Lineal", "Estadística", "Física Mecánica", "Química Orgánica", "Biología Celular", "Matemáticas Financieras", "Lógica Matemática", "Geometría", "Termodinámica"],
    },
    {
      name: "Oposiciones y Leyes",
      color: "#6366f1",
      topics: ["Constitución Española", "Derecho Administrativo", "Estatuto de los Trabajadores", "Código Penal", "Ley de Contratos del Sector Público", "Derecho Civil", "Derecho Tributario", "Protección de Datos", "Oposiciones a Administrativo", "Fuerzas y Cuerpos de Seguridad"],
    },
    {
      name: "Negocios y Finanzas",
      color: "#06b6d4",
      topics: ["Excel", "Contabilidad", "Finanzas Personales", "Gestión de Proyectos", "Marketing Digital", "Comercio Electrónico", "Emprendimiento", "Liderazgo", "Economía", "Ventas"],
    },
    {
      name: "Humanidades e Historia",
      color: "#f97316",
      topics: ["Historia de España", "Historia del Arte", "Filosofía", "Segunda Guerra Mundial", "Literatura Universal", "Geografía Política", "Mitología", "Sociología", "Antropología", "Escritura Creativa"],
    },
    {
      name: "Tecnología y Datos",
      color: "#ec4899",
      topics: ["Inteligencia Artificial", "Prompt Engineering", "Ciberseguridad", "Análisis de Datos", "Power BI", "Blockchain", "Cloud Computing", "Automatización", "Internet de las Cosas", "Edición de Video"],
    },
    {
      name: "Habilidades Blandas",
      color: "#14b8a6",
      topics: ["Hablar en Público", "Gestión del Tiempo", "Inteligencia Emocional", "Resolución de Conflictos", "Pensamiento Crítico", "Técnicas de Estudio", "Comunicación Asertiva", "Entrevistas de Trabajo", "Trabajo en Equipo", "Gestión del Estrés"],
    },
    {
      name: "Salud y Ciencias",
      color: "#ef4444",
      topics: ["Anatomía Humana", "Nutrición", "Fisiología", "Primeros Auxilios", "Psicología", "Neurociencia", "Farmacología", "Genética", "Microbiología", "Salud Pública"],
    },
    {
      name: "Diseño y Creatividad",
      color: "#d946ef",
      topics: ["Diseño UX UI", "Photoshop", "Diseño Gráfico", "Ilustración Digital", "Fotografía", "Modelado 3D", "Diseño de Interiores", "Música", "Historia de la Moda", "Arquitectura"],
    },
  ], []);

  // Función para renderizar el icono según el tipo (no usada actualmente)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderIcon = (iconType: string = "chat", color: string = "#6366f1", isSelected: boolean = false) => {
    const iconColor = color || "#6366f1";
    // Si está seleccionado, usar blanco. Si no, usar el color del tema
    const strokeColor = isSelected 
      ? (iconColor ? "white" : "#6366f1")
      : (colorTheme === "dark" ? "rgba(226, 232, 240, 0.9)" : "rgba(26, 36, 52, 0.9)");
    
    switch (iconType) {
      case "book":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case "notes":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
        );
      case "target":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      case "star":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case "chat":
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
    }
  };
  
  // Sincronizar ref con state
  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);
  
  // Cargar chat "General" al iniciar si no hay chat seleccionado
  useEffect(() => {
    if (userId && !currentChatId) {
      loadOrCreateGeneralChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  
  const loadOrCreateGeneralChat = async () => {
    if (!userId) return;
    
    try {
      // Buscar chat "General" en la lista
      const response = await fetch("/api/study-agents/list-chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      if (data.success && data.chats) {
        interface ChatItem {
          title?: string;
          chat_id?: string;
          [key: string]: unknown;
        }
        const generalChat = (data.chats as ChatItem[]).find((chat: ChatItem) => chat.title === "General");
        if (generalChat && generalChat.chat_id) {
          // Cargar el chat General existente
          await loadChat(generalChat.chat_id);
        } else {
          // Crear nuevo chat General
          const newChatId = `general-${Date.now()}`;
          setCurrentChatId(newChatId);
          currentChatIdRef.current = newChatId;
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Error loading General chat:", error);
    }
  };
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
    return "auto"; // Modo automático por defecto
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
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

  // Detectar si el usuario está al final del chat
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) {
      setShowScrollToBottom(false);
      return;
    }

    const checkScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Verificar si hay contenido suficiente para hacer scroll
      const hasScrollableContent = scrollHeight > clientHeight;
      // Verificar si está cerca del final (con un margen más generoso)
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isAtBottom = distanceFromBottom < 200; // 200px de margen
      const shouldShow = hasScrollableContent && !isAtBottom && messages.length > 0;
      setShowScrollToBottom(shouldShow);
    };

    // Verificar inmediatamente
    setTimeout(checkScrollPosition, 100);
    
    container.addEventListener('scroll', checkScrollPosition);
    
    // También verificar cuando cambian los mensajes
    const observer = new MutationObserver(() => {
      setTimeout(checkScrollPosition, 100);
    });
    observer.observe(container, { childList: true, subtree: true });

    // Verificar periódicamente también
    const interval = setInterval(checkScrollPosition, 500);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      observer.disconnect();
      clearInterval(interval);
    };
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
    } catch {
          setShowAPIKeyConfig(true);
        }
      } else {
        setShowAPIKeyConfig(true);
      }
    }
  }, []);

  // Escuchar cambios en las API keys (cuando se actualizan desde el Header)
  useEffect(() => {
    const handleApiKeysUpdate = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("study_agents_api_keys");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.openai && parsed.openai.startsWith("sk-")) {
              setApiKeys(parsed);
            } else {
              setApiKeys(null);
            }
          } catch (e) {
            console.error("Error loading API keys:", e);
            setApiKeys(null);
          }
        } else {
          setApiKeys(null);
        }
      }
    };

    window.addEventListener("apiKeysUpdated", handleApiKeysUpdate);
    return () => {
      window.removeEventListener("apiKeysUpdated", handleApiKeysUpdate);
    };
  }, []);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(target)) {
        setShowModelDropdown(false);
      }
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(target)) {
        setShowLevelDropdown(false);
      }
    };

    if (showModelDropdown || showLevelDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showModelDropdown, showLevelDropdown]);

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

        // Si se detectó un tema del documento, establecerlo para este chat
        const detectedTopic = data.data?.detected_topic;
        if (detectedTopic && currentChatId && userId) {
          console.log(`🎯 Tema detectado del documento: ${detectedTopic}`);
          // Establecer el tema del chat basado en el documento subido
          setCurrentChatLevel({ topic: detectedTopic, level: currentChatLevel?.level || 0 });
          
          // Guardar el tema en el backend para este chat
          fetch("/api/study-agents/set-chat-level", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              chat_id: currentChatId,
              level: currentChatLevel?.level || 0,
              topic: detectedTopic,
            }),
          }).catch(err => console.error("Error estableciendo tema del documento:", err));
        }

        // Crear mensaje visual mejorado con componente especial
        addMessage({
          role: "assistant",
          content: JSON.stringify({
            type: "success",
            fileNames: fileNames,
            detectedTopic: detectedTopic, // Incluir tema detectado en el mensaje
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al subir archivos";
      addMessage({
        role: "assistant",
        content: `Error al subir archivos: ${message}`,
        type: "message",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages((prev) => {
      const updated = [...prev, newMessage];
      // Guardar automáticamente después de agregar mensaje
      // Usar el userId actual del scope, no del closure
      const currentUserId = session?.user?.id || "";
      if (currentUserId) {
        // Usar setTimeout para asegurar que el estado se actualice primero
        setTimeout(() => {
          saveChatDebounced(updated);
        }, 0);
      } else {
        console.warn("Cannot save chat: userId not available", { userId: currentUserId, session });
      }
      return updated;
    });
    
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
    
    // Cargar nivel del tema para mensajes del asistente
    if (message.role === "assistant" && message.content) {
      // Usar setTimeout para asegurar que el mensaje ya esté en el estado
      setTimeout(() => {
        loadMessageLevel(newMessage.id, message.content);
      }, 100);
    }
  };
  
  // Cargar niveles de mensajes existentes cuando cambian los mensajes
  useEffect(() => {
    if (!userId) return;
    
    messages.forEach((msg) => {
      if (msg.role === "assistant" && msg.content && !messageLevels[msg.id]) {
        loadMessageLevel(msg.id, msg.content);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, userId]); // Solo cuando cambia la cantidad de mensajes

  // Función para guardar chat (con debounce)
  const saveChatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveChatAttemptIdRef = useRef<number>(0);
  const saveChatDebounced = (messagesToSave: Message[]) => {
    // Cancelar cualquier guardado pendiente
    if (saveChatTimeoutRef.current) {
      clearTimeout(saveChatTimeoutRef.current);
      saveChatTimeoutRef.current = null;
    }
    
    // Incrementar el ID del intento
    saveChatAttemptIdRef.current += 1;
    const attemptId = saveChatAttemptIdRef.current;
    
    // Programar el guardado (siempre se guarda en "General" si no hay chat seleccionado)
    saveChatTimeoutRef.current = setTimeout(() => {
      // Verificar que este intento sigue siendo el más reciente
      if (attemptId !== saveChatAttemptIdRef.current) {
        console.log("⏳ Cancelando guardado: hay un intento más reciente");
        return;
      }
      
      saveChat(messagesToSave);
      saveChatTimeoutRef.current = null;
    }, 1000); // Guardar después de 1 segundo de inactividad
  };

  const saveChat = async (messagesToSave: Message[] = messages) => {
    // Obtener userId actualizado del session (no usar la variable userId del closure)
    const currentUserId = session?.user?.id || "";
    
    if (!currentUserId) {
      console.warn("⚠️ No userId available, cannot save chat", { session, userId });
      return;
    }
    
    if (messagesToSave.length === 0) {
      console.warn("⚠️ No messages to save");
      return;
    }

    // Obtener o crear chat_id (si no hay uno, usar "General")
    let chatIdToUse = currentChatIdRef.current;
    let chatTitle = "General";
    
    if (!chatIdToUse) {
      // Buscar chat "General" existente
      try {
        const listResponse = await fetch("/api/study-agents/list-chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUserId }),
        });
        
        const listData = await listResponse.json();
        if (listData.success && listData.chats) {
          interface ChatItem {
            title?: string;
            chat_id?: string;
            [key: string]: unknown;
          }
          const generalChat = (listData.chats as ChatItem[]).find((chat: ChatItem) => chat.title === "General");
          if (generalChat && generalChat.chat_id) {
            chatIdToUse = generalChat.chat_id;
            setCurrentChatId(generalChat.chat_id);
            currentChatIdRef.current = generalChat.chat_id;
          } else {
            // Crear nuevo chat General
            chatIdToUse = `general-${Date.now()}`;
            setCurrentChatId(chatIdToUse);
            currentChatIdRef.current = chatIdToUse;
          }
        } else {
          // Crear nuevo chat General
          chatIdToUse = `general-${Date.now()}`;
          setCurrentChatId(chatIdToUse);
          currentChatIdRef.current = chatIdToUse;
        }
      } catch (error) {
        console.error("Error finding General chat:", error);
        // Crear nuevo chat General como fallback
        chatIdToUse = `general-${Date.now()}`;
        setCurrentChatId(chatIdToUse);
        currentChatIdRef.current = chatIdToUse;
      }
    } else {
      // Si hay un chat_id, obtener su título para verificar si es "General"
      try {
        const loadResponse = await fetch("/api/study-agents/load-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUserId, chatId: chatIdToUse }),
        });
        
        const loadData = await loadResponse.json();
        if (loadData.success && loadData.chat) {
          chatTitle = loadData.chat.title || "General";
        }
      } catch (error) {
        console.error("Error loading chat title:", error);
      }
    }

    try {
      console.log("💾 Saving chat...", { 
        userId: currentUserId, 
        messageCount: messagesToSave.length, 
        chatId: chatIdToUse,
        chatTitle
      });
      
      // Usar el título del chat si existe, o "General" por defecto
      const title = chatTitle;

      // Convertir mensajes al formato esperado por el backend
      const messagesForBackend = messagesToSave.map((msg) => ({
        role: msg.role,
        content: msg.content,
        type: msg.type || "message",
        timestamp: msg.timestamp.toISOString(),
        topic: msg.topic || undefined, // Preservar el tema si existe (para mensajes de selección de nivel)
      }));

      const response = await fetch("/api/study-agents/save-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUserId,
          chatId: chatIdToUse,
          title,
          messages: messagesForBackend,
          metadata: {
            uploadedFiles,
            selectedModel,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error saving chat - response not ok:", errorData);
        return;
      }

      const data = await response.json();
      console.log("✅ Chat saved successfully:", data);
      
      if (data.success && data.chat) {
        // Actualizar currentChatId si no estaba establecido
        if (!currentChatIdRef.current) {
          setCurrentChatId(data.chat.chat_id);
          currentChatIdRef.current = data.chat.chat_id;
        }
        // Refrescar sidebar si está disponible
        interface WindowWithRefresh extends Window {
          refreshChatSidebar?: () => void;
        }
        if (typeof window !== "undefined") {
          const refreshChatSidebar = (window as WindowWithRefresh).refreshChatSidebar;
          if (refreshChatSidebar) {
            refreshChatSidebar();
          }
        }
      } else {
        console.error("❌ Chat save response indicates failure:", data);
      }
    } catch (error) {
      console.error("❌ Error saving chat:", error);
    }
  };

  const loadChat = async (chatId: string) => {
    if (!userId) return;

    try {
      const response = await fetch("/api/study-agents/load-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, chatId         }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.chat) {
        // Convertir mensajes del backend al formato del frontend
        interface BackendMessage {
          role: string;
          content: string;
          type?: string;
          timestamp?: string;
          topic?: string;
        }
        const loadedMessages: Message[] = (data.chat.messages as BackendMessage[]).map((msg: BackendMessage) => ({
          id: Date.now().toString() + Math.random(),
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          type: (msg.type || "message") as Message["type"],
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          topic: msg.topic || undefined, // Preservar el tema si existe (para mensajes de selección de nivel)
        }));

        setMessages(loadedMessages);
        setCurrentChatId(chatId);
        currentChatIdRef.current = chatId;

        // Restaurar metadata si existe
        if (data.chat.metadata) {
          if (data.chat.metadata.uploadedFiles) {
            setUploadedFiles(data.chat.metadata.uploadedFiles);
          }
          if (data.chat.metadata.selectedModel) {
            setSelectedModel(data.chat.metadata.selectedModel);
          }
          // Si hay un tema en metadata, establecerlo
          if (data.chat.metadata.topic) {
            // El nivel se cargará desde el backend
            console.log(`[loadChat] Tema encontrado en metadata: ${data.chat.metadata.topic}`);
            setCurrentChatLevel({ topic: data.chat.metadata.topic, level: 0 }); // Nivel temporal, se actualizará con loadChatLevel
          } else {
            console.log("[loadChat] No hay tema en metadata");
          }
          
          // Verificar si hay información del formulario inicial
          if (data.chat.metadata.initialForm) {
            setInitialFormData(data.chat.metadata.initialForm);
            setShowInitialForm(false); // Ya tiene datos, no mostrar formulario
          } else if (data.chat.messages.length === 0) {
            // Si no hay mensajes y no hay datos del formulario, mostrar formulario
            setShowInitialForm(true);
          }
        } else {
          console.log("[loadChat] No hay metadata en el chat");
          // Si no hay metadata y no hay mensajes, mostrar formulario
          if (data.chat.messages.length === 0) {
            setShowInitialForm(true);
          }
        }

        // Limpiar estado anterior al cargar un nuevo chat
        setLearnedWordsCount(0);
        setShowLanguageTool(false);
        setShowCodeTool(false);

        // Cargar nivel de la conversación (esto actualizará el tema, nivel, palabras aprendidas y herramientas)
        if (userId && chatId) {
          await loadChatLevel(chatId);
        } else {
          // Si no hay chatId, limpiar el nivel actual
          setCurrentChatLevel(null);
        }
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const createNewChat = () => {
    setShowNewChatModal(true);
    setNewChatName("");
    setNewChatColor("#6366f1");
  };
  
  const handleCreateNewChat = async (predefinedName?: string, predefinedColor?: string, predefinedIcon?: string) => {
    const chatName = predefinedName || newChatName.trim();
    const chatColor = predefinedColor || newChatColor;
    const chatIcon = predefinedIcon || newChatIcon;
    
    if (!chatName) {
      alert("Por favor, introduce un nombre para el chat");
      return;
    }
    
    if (!userId) return;
    
    // Crear nuevo chat con el nombre proporcionado
    const newChatId = `chat-${Date.now()}`;
    
    try {
      const response = await fetch("/api/study-agents/save-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          chatId: newChatId,
          title: chatName,
          messages: [],
          metadata: {
            uploadedFiles: [],
            selectedModel,
            color: chatColor,
            icon: chatIcon,
            topic: predefinedName || null, // Guardar el tema si viene de una sugerencia
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.chat) {
        // Limpiar estado y cargar el nuevo chat
        setMessages([]);
        setCurrentChatId(newChatId);
        currentChatIdRef.current = newChatId;
        setUploadedFiles([]);
        setCurrentTest(null);
        setTestAnswers({});
        setTotalStats({
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCost: 0,
          byModel: {},
        });
        setShowNewChatModal(false);
        setNewChatName("");
        setNewChatColor("#6366f1");
        setNewChatIcon("chat");
        
        // Mostrar formulario inicial para recopilar información del usuario
        setShowInitialForm(true);
        setInitialFormData({
          level: null,
          learningGoal: "",
          timeAvailable: "",
        });
        
        // Si se seleccionó un tema sugerido (predefinedName existe), establecer el tema
        if (predefinedName) {
          console.log(`[handleCreateNewChat] Tema sugerido detectado: ${predefinedName}`);
          setCurrentChatLevel({ topic: predefinedName, level: 0 }); // Establecer nivel 0 por defecto
        }
        
        // Refrescar sidebar
        interface WindowWithRefresh extends Window {
          refreshChatSidebar?: () => void;
        }
        if (typeof window !== "undefined") {
          const refreshChatSidebar = (window as WindowWithRefresh).refreshChatSidebar;
          if (refreshChatSidebar) {
            refreshChatSidebar();
          }
        }
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
      alert("Error al crear el chat. Por favor, intenta de nuevo.");
    }
  };

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if (typeof window !== "undefined") {
      interface WindowWithSpeechRecognition extends Window {
        SpeechRecognition?: new () => SpeechRecognition;
        webkitSpeechRecognition?: new () => SpeechRecognition;
      }
      const SpeechRecognition = (window as WindowWithSpeechRecognition).SpeechRecognition || (window as WindowWithSpeechRecognition).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        // Detectar idioma del chat para usar el reconocimiento de voz apropiado
        let recognitionLang = "es-ES"; // Español por defecto
        if (currentChatLevel?.topic) {
          const topicLower = currentChatLevel.topic.toLowerCase();
          const langMap: Record<string, string> = {
            "inglés": "en-US",
            "english": "en-US",
            "francés": "fr-FR",
            "francais": "fr-FR",
            "alemán": "de-DE",
            "deutsch": "de-DE",
            "italiano": "it-IT",
            "portugués": "pt-PT",
            "chino": "zh-CN",
            "chino simplificado": "zh-CN",
            "japonés": "ja-JP",
            "japones": "ja-JP",
            "coreano": "ko-KR",
            "catalán": "ca-ES",
            "catalan": "ca-ES",
            "ruso": "ru-RU",
          };
          recognitionLang = langMap[topicLower] || "es-ES";
        }
        recognition.lang = recognitionLang;
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join("");
          setInput(prev => prev + (prev ? " " : "") + transcript);
          setIsListening(false);
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Error en reconocimiento de voz:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            alert("Por favor, permite el acceso al micrófono en la configuración del navegador.");
          }
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentChatLevel?.topic]); // Re-inicializar cuando cambie el idioma del chat

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("El reconocimiento de voz no está disponible en tu navegador. Por favor, usa Chrome o Edge.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error al iniciar reconocimiento de voz:", error);
        setIsListening(false);
      }
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

    let userMessage = input.trim();
    setInput("");
    // Resetear altura del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }
    setIsLoading(true);

    addMessage({
      role: "user",
      content: userMessage,
      type: "message",
    });

    try {
      // Detectar URLs en el mensaje
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,}\/[^\s]*)/gi;
      const urls = userMessage.match(urlRegex);
      
      if (urls && urls.length > 0) {
        // Procesar cada URL encontrada
        for (const url of urls) {
          setLoadingMessage(`Procesando ${url}...`);
          
          try {
            const response = await fetch("/api/study-agents/process-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: url,
                userId: userId,
                apiKey: apiKeys?.openai,
                model: selectedModel,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              
              if (data.success) {
                if (data.type === "video") {
                  // Mostrar resumen del video con formato mejorado
                  const videoContent = `---
### 🎬 Resumen del Video

**📺 Título:** ${data.title || "Video"}

**🔗 URL:** [${url}](${data.url})

---

#### 📝 Resumen:

${data.summary || data.description || "No se pudo obtener el resumen del video."}

---

*✨ Puedes hacer preguntas sobre el contenido del video.*`;
                  
                  addMessage({
                    role: "assistant",
                    content: videoContent,
                    type: "notes",
                  });
                } else if (data.type === "text") {
                  // Mostrar contenido extraído con formato mejorado y diseño visual atractivo
                  const contentPreview = data.content.length > 3000 
                    ? data.content.substring(0, 3000) + "...\n\n---\n\n*💡 Contenido truncado. Puedes hacer preguntas sobre el contenido completo.*"
                    : data.content;
                  
                  // Limpiar la URL para evitar saltos de línea y espacios
                  const cleanUrl = url.trim().replace(/\s+/g, '').replace(/\n/g, '').replace(/\r/g, '');
                  
                  // Formato mejorado con diseño visual atractivo usando solo markdown
                  // Usar código inline para la URL para evitar que se rompa en markdown
                  const formattedContent = `---
## 🌐 ${data.title || "Contenido Web Extraído"}

**🔗 URL Original:** [Ver página](${cleanUrl})

\`${cleanUrl}\`

---

### 📋 Contenido Extraído:

${contentPreview}

---

> ✨ **Este contenido ha sido procesado y está disponible para consultas.**  
> Puedes hacer preguntas sobre él en el chat.

---`;
                  
                  addMessage({
                    role: "assistant",
                    content: formattedContent,
                    type: "notes",
                  });
                  
                  // Opcionalmente, almacenar el contenido en memoria para hacer preguntas sobre él
                  // Esto requeriría un endpoint adicional para almacenar contenido de URLs
                }
              } else {
                addMessage({
                  role: "assistant",
                  content: `❌ Error al procesar la URL: ${data.error || "Error desconocido"}`,
                  type: "message",
                });
              }
            } else {
              addMessage({
                role: "assistant",
                content: `❌ Error al procesar la URL: ${url}`,
                type: "message",
              });
            }
          } catch (error) {
            console.error("Error procesando URL:", error);
            addMessage({
              role: "assistant",
              content: `❌ Error al procesar la URL: ${url}`,
              type: "message",
            });
          }
        }
        
        // Continuar con el procesamiento normal después de procesar las URLs
        // El contenido de las URLs ya está almacenado en memoria y estará disponible
        // para el contexto de la pregunta
        // Limpiar las URLs del mensaje para que la pregunta se procese correctamente
        if (urls && urls.length > 0) {
          // Eliminar las URLs del mensaje original para que solo quede la pregunta
          let cleanedMessage = userMessage;
          urls.forEach(url => {
            cleanedMessage = cleanedMessage.replace(url, '').trim();
          });
          // Si después de eliminar las URLs queda texto, actualizar el mensaje
          if (cleanedMessage.length > 0) {
            userMessage = cleanedMessage;
          }
        }
      }
      
      // Detectar comandos especiales
      const lowerInput = userMessage.toLowerCase();
      
      // Detectar si el usuario quiere cambiar el nivel manualmente
      const levelChangePatterns = [
        /(?:cambiar|poner|establecer|pon|fijar|ajustar|modificar)\s+(?:el\s+)?nivel\s+(?:a\s+)?(\d+)/i,
        /nivel\s+(?:a\s+)?(\d+)/i,
        /(?:ponme|ponme en|establece|establece en)\s+(?:el\s+)?nivel\s+(\d+)/i,
      ];
      
      let requestedLevel: number | null = null;
      for (const pattern of levelChangePatterns) {
        const match = userMessage.match(pattern);
        if (match && match[1]) {
          requestedLevel = parseInt(match[1], 10);
          if (requestedLevel >= 0 && requestedLevel <= 10) {
            break;
          } else {
            requestedLevel = null;
          }
        }
      }
      
      if (requestedLevel !== null && currentChatId) {
        // Cambiar el nivel manualmente
        try {
          // Obtener el tema del chat actual (desde currentChatLevel o desde el título del chat)
          const chatTopic = currentChatLevel?.topic || null;
          
          const response = await fetch("/api/study-agents/set-chat-level", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              chatId: currentChatId,
              level: requestedLevel,
              topic: chatTopic, // Enviar el tema si está disponible
            }),
          });
          
          const data = await response.json();
          if (data.success) {
            const topic = data.result?.topic || currentChatLevel?.topic || "General";
            setCurrentChatLevel({ topic, level: requestedLevel });
            addMessage({
              role: "assistant",
              content: `✅ Nivel actualizado a **${requestedLevel}/10** para **${topic}**.`,
              type: "message",
            });
            setIsLoading(false);
            return;
          } else {
            throw new Error(data.error || "Error al actualizar el nivel");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error inesperado";
          addMessage({
            role: "assistant",
            content: `Error al cambiar el nivel: ${errorMessage}`,
            type: "message",
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Detectar si el usuario está pidiendo un test
      const testKeywords = ["test", "examen", "evaluación", "prueba", "cuestionario", "genera un test", "hazme un test", "crea un test", "quiero un test"];
      const isTestRequest = testKeywords.some(keyword => lowerInput.includes(keyword));
      
      // Detectar si el usuario está pidiendo flashcards
      const flashcardKeywords = [
        "flashcard", "flashcards", "flash card", "flash cards",
        "quiero flashcards", "muéstrame flashcards", "dame flashcards",
        "genera flashcards", "haz flashcards", "crea flashcards", "hazme flashcards",
        "quiero tarjetas", "muéstrame tarjetas", "dame tarjetas",
        "genera tarjetas", "haz tarjetas", "crea tarjetas", "hazme tarjetas"
      ];
      const isFlashcardRequest = flashcardKeywords.some(keyword => lowerInput.includes(keyword));
      
      // Detectar si el usuario está pidiendo un ejercicio
      const exerciseKeywords = ["ejercicio", "ejercicios", "genera un ejercicio", "hazme un ejercicio", "crea un ejercicio", "quiero un ejercicio", "hazme ejercicio", "crea ejercicio"];
      const isExerciseRequest = exerciseKeywords.some(keyword => lowerInput.includes(keyword));

      // Si se solicita flashcards, activar la herramienta automáticamente
      if (isFlashcardRequest) {
        // Extraer tema de la solicitud
        let flashcardTopic: string | null = null;
        const flashcardTopicPatterns = [
          /flashcards?\s+(?:de|sobre|acerca de|del|de la|de los|de las|para)\s+(.+?)(?:\s+con|\s*$)/i,
          /hazme\s+flashcards?\s+(?:de|sobre|acerca de|para)\s+(.+?)(?:\s+con|\s*$)/i,
          /crea\s+flashcards?\s+(?:de|sobre|acerca de|para)\s+(.+?)(?:\s+con|\s*$)/i,
          /genera\s+flashcards?\s+(?:de|sobre|acerca de|para)\s+(.+?)(?:\s+con|\s*$)/i,
          /dame\s+flashcards?\s+(?:de|sobre|acerca de|para)\s+(.+?)(?:\s+con|\s*$)/i,
          /tarjetas?\s+(?:de|sobre|acerca de|para)\s+(.+?)(?:\s+con|\s*$)/i,
          /hazme\s+tarjetas?\s+(?:de|sobre|acerca de|para)\s+(.+?)(?:\s+con|\s*$)/i,
          /dame\s+tarjetas?\s+(?:de|sobre|acerca de|para)\s+(.+?)(?:\s+con|\s*$)/i,
        ];
        
        for (const pattern of flashcardTopicPatterns) {
          const match = userMessage.match(pattern);
          if (match && match[1]) {
            flashcardTopic = match[1].trim();
            flashcardTopic = flashcardTopic.replace(/^(de|sobre|acerca de|del|de la|de los|de las|para)\s+/i, '').trim();
            flashcardTopic = flashcardTopic.replace(/\s+con\s+.+$/i, '').trim();
            if (flashcardTopic && flashcardTopic.length > 2) {
              break;
            }
          }
        }
        
        // Si no se encontró tema específico, usar el tema del chat actual o "General"
        if (!flashcardTopic) {
          flashcardTopic = currentChatLevel?.topic || "General";
        }
        
        // Establecer el tema PRIMERO antes de activar la herramienta
        // Esto asegura que cuando el componente se monte, tenga el tema correcto
        if (flashcardTopic) {
          const newLevel = currentChatLevel?.level || 0;
          setCurrentChatLevel({ topic: flashcardTopic, level: newLevel });
          
          // Guardar el nivel en el backend si hay chatId
          if (currentChatId && userId) {
            fetch("/api/study-agents/set-chat-level", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                chatId: currentChatId,
                level: newLevel,
                topic: flashcardTopic,
              }),
            }).catch(err => console.error("Error estableciendo tema de flashcards:", err));
          }
        }
        
        // Activar la herramienta de flashcards DESPUÉS de establecer el tema
        // Usar setTimeout para asegurar que el estado se actualice primero
        setTimeout(() => {
          setShowLanguageTool(true);
        }, 100);
        
        // Continuar con la respuesta normal del asistente
        // (no retornar aquí, dejar que el flujo normal continúe)
      }

      if (lowerInput.includes("genera apuntes") || lowerInput.includes("crea apuntes")) {
        await generateNotes();
      } else if (isExerciseRequest || lowerInput.includes("genera ejercicio") || lowerInput.includes("crea ejercicio") || lowerInput.includes("hazme ejercicio")) {
        // Procesar solicitud de ejercicio
        const difficulty = lowerInput.includes("fácil") || lowerInput.includes("facil") ? "easy" : 
                          lowerInput.includes("difícil") || lowerInput.includes("dificil") ? "hard" : "medium";
        
        // Extraer tema/tópico del mensaje
        let topic: string | null = null;
        const topicPatterns = [
          /ejercicio\s+(?:de|sobre|acerca de)\s+(.+?)(?:\s+con|\s*$)/i,
          /hazme\s+(?:un\s+)?ejercicio\s+(?:de|sobre|acerca de)\s+(.+?)(?:\s+con|\s*$)/i,
          /crea\s+(?:un\s+)?ejercicio\s+(?:de|sobre|acerca de)\s+(.+?)(?:\s+con|\s*$)/i,
          /genera\s+(?:un\s+)?ejercicio\s+(?:de|sobre|acerca de)\s+(.+?)(?:\s+con|\s*$)/i,
        ];
        
        for (const pattern of topicPatterns) {
          const match = userMessage.match(pattern);
          if (match && match[1]) {
            topic = match[1].trim();
            // Limpiar el tema de palabras comunes y condiciones
            topic = topic.replace(/^(de|sobre|acerca de|del|de la|de los|de las)\s+/i, '').trim();
            // Remover condiciones si están incluidas
            topic = topic.replace(/\s+con\s+.+$/i, '').trim();
            if (topic && topic.length > 2) {
              break;
            }
          }
        }
        
        // Si no se encontró con patrones, buscar después de "ejercicio de"
        if (!topic) {
          const ejercicioDeMatch = userMessage.match(/ejercicio\s+(?:de|sobre)\s+(.+?)(?:\s+con|\s*$)/i);
          if (ejercicioDeMatch) {
            topic = ejercicioDeMatch[1].trim();
            topic = topic.replace(/\s+con\s+.+$/i, '').trim();
          }
        }
        
        // Extraer condiciones/restricciones del mensaje
        let constraints: string | null = null;
        const constraintPatterns = [
          /(?:con|usando|usar|que use|que utilice|que incluya|que contenga)\s+(?:solo|únicamente|exclusivamente|solamente)?\s*(.+?)(?:\s*$)/i,
          /(?:condiciones?|restricciones?|requisitos?|reglas?):\s*(.+?)(?:\s*$)/i,
        ];
        
        for (const pattern of constraintPatterns) {
          const match = userMessage.match(pattern);
          if (match && match[1]) {
            constraints = match[1].trim();
            // Limpiar el tema del constraint si está incluido
            if (topic && constraints.includes(topic)) {
              constraints = constraints.replace(new RegExp(topic, 'i'), '').trim();
            }
            // Limpiar palabras comunes
            constraints = constraints.replace(/^(con|usando|usar|que use|que utilice|que incluya|que contenga|solo|únicamente|exclusivamente|solamente)\s+/i, '').trim();
            if (constraints && constraints.length > 3) {
              break;
            }
          }
        }
        
        // Si no se encontró con patrones, buscar después de "con"
        if (!constraints) {
          const conMatch = userMessage.match(/con\s+(.+?)$/i);
          if (conMatch && conMatch[1]) {
            constraints = conMatch[1].trim();
            // Remover el tema si está incluido
            if (topic && constraints.includes(topic)) {
              constraints = constraints.replace(new RegExp(topic, 'i'), '').trim();
            }
          }
        }
        
        setIsGeneratingExercise(true);
        await generateExercise(difficulty, topic, constraints);
        setIsGeneratingExercise(false);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error inesperado";
      addMessage({
        role: "assistant",
        content: `Error: ${message}`,
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
      
      // Preparar historial de conversación (últimos mensajes relevantes)
      const conversationHistory = messages
        .filter(msg => msg.type === "message")
        .slice(-20) // Últimos 20 mensajes
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
      
      // Obtener el tema y nivel del chat actual
      // const topic = currentChatLevel?.topic || null;
      // const level = currentChatLevel?.level || null;
      
      // Llamar a la API con la key del usuario y el modelo seleccionado
      const response = await fetch("/api/study-agents/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeys.openai,
          uploadedFiles: uploadedFiles,
          model: selectedModel === "auto" ? null : selectedModel,
          userId: userId,
          chatId: currentChatId, // Pasar chatId para obtener el nivel
          conversationHistory: conversationHistory,
          topic: currentChatLevel?.topic || undefined,
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
    } catch (error: unknown) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      const errorMessage = isAbort
        ? "La solicitud tardó demasiado tiempo. Por favor, intenta de nuevo o verifica que el servidor esté funcionando."
        : error instanceof Error && error.message
          ? error.message
          : "No se pudieron generar los apuntes. Asegúrate de haber subido documentos primero.";
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

    // Asegurar que flashcards NO se active cuando se genera un test
    setShowLanguageTool(false);

    // Cargar el nivel del usuario ANTES de generar el test
    let currentLevel = 0;
    if (currentChatId && userId) {
      currentLevel = await loadChatLevel(currentChatId) ?? 0;
      console.log(`📊 [Frontend] Nivel cargado para generar test: ${currentLevel}/10`);
      // Asegurar que flashcards NO se active después de cargar el nivel (si el tema es idioma)
      setShowLanguageTool(false);
    }

    // Usar el número de preguntas proporcionado o generar uno aleatorio entre 5 y 10
    const finalNumQuestions = numQuestions && numQuestions >= 5 && numQuestions <= 20 
      ? numQuestions 
      : (Math.random() < 0.5 ? 5 : 10); // 5 o 10 preguntas aleatoriamente
    
    const topicText = topic ? ` sobre ${topic}` : "";
    setLoadingMessage(`Generando test de nivel ${currentLevel}/10${topicText}...`);
    setIsGeneratingTest(true);
    // No añadir mensaje de texto, solo mostrar la animación de carga

    try {
      // Preparar historial de conversación (incluir mensajes y apuntes)
      const conversationHistory = messages
        .filter(msg => 
          (msg.role === "user" || msg.role === "assistant") && 
          (msg.type === "message" || msg.type === "notes") && // Incluir apuntes también
          msg.content && 
          msg.content.trim().length > 0
        )
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      console.log("📝 Enviando historial de conversación al generar test:", {
        totalMessages: messages.length,
        conversationHistoryLength: conversationHistory.length,
        lastMessages: conversationHistory.slice(-5).map(m => ({ role: m.role, contentPreview: m.content.substring(0, 100) }))
      });

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
          model: selectedModel === "auto" ? null : selectedModel,
          conversation_history: conversationHistory.length > 0 ? conversationHistory : null,
          userId: userId,
          chatId: currentChatId || currentChatIdRef.current,  // Pasar chat_id para obtener el nivel
        }),
      });

      const data = await response.json();

      if (data.success && data.test && data.test.questions && Array.isArray(data.test.questions)) {
        // Obtener el nivel del usuario actual para incluirlo en el test
        const currentLevel = currentChatLevel?.level ?? 0;
        
        // Asegurar que el test tenga topics y el nivel del usuario
        const testWithTopics = {
          ...data.test,
          topics: topic ? [topic] : data.test.topics || [],
          user_level: currentLevel,  // Incluir el nivel del usuario cuando se generó el test
        };
        setCurrentTest(testWithTopics);
        setTestAnswers({});
        
        // Cargar nivel de la conversación si hay un chatId
        if (currentChatId && userId) {
          loadChatLevel(currentChatId);
        }

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

        // Limpiar tests anteriores antes de añadir el nuevo
        setMessages((prev) => {
          const filtered = prev.filter(msg => msg.type !== "test");
          return [...filtered, {
            id: Date.now().toString() + Math.random(),
            role: "assistant" as const,
            content: `Test generado con ${data.test?.questions?.length || 0} preguntas`,
            type: "test" as const,
            timestamp: new Date(),
          costEstimate,
          }];
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

        // Limpiar tests anteriores antes de añadir el nuevo
        setMessages((prev) => {
          const filtered = prev.filter(msg => msg.type !== "test");
          return [...filtered, {
            id: Date.now().toString() + Math.random(),
            role: "assistant" as const,
            content: `Test generado con ${test?.questions?.length || 0} preguntas`,
            type: "test" as const,
            timestamp: new Date(),
          }];
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error generando test";
      addMessage({
        role: "assistant",
        content: `Error: ${message}`,
        type: "message",
      });
    } finally {
      setIsGeneratingTest(false);
      setIsLoading(false);
    }
  };

  const generateExercise = async (difficulty: string = "medium", topic?: string | null, constraints?: string | null) => {
    if (!apiKeys?.openai) {
      setShowAPIKeyConfig(true);
      return;
    }

    // Usar el tema de la conversación actual si no se proporciona uno
    const exerciseTopic = topic || (currentChatLevel?.topic) || null;
    
    console.log("[generateExercise] Topic parameter:", topic);
    console.log("[generateExercise] currentChatLevel:", currentChatLevel);
    console.log("[generateExercise] Final exerciseTopic:", exerciseTopic);
    
    // Detectar si es un tema de programación
    const isProgramming = exerciseTopic && isProgrammingLanguage(exerciseTopic);
    console.log("[generateExercise] Is programming:", isProgramming);
    
    // Construir constraints para ejercicios de programación
    let exerciseConstraints = constraints;
    if (isProgramming && !constraints) {
      exerciseConstraints = `IMPORTANTE: Este ejercicio DEBE ser de programación práctica.
- El ejercicio debe requerir escribir código ejecutable en ${exerciseTopic}
- La respuesta esperada debe incluir el código completo y la salida esperada del programa
- El formato debe ser: código que el estudiante debe escribir, y la salida esperada que debe producir
- Ejemplo de formato para la respuesta esperada: "Salida esperada:\n[output del programa]"
- El ejercicio debe ser práctico y ejecutable, no teórico`;
    }

    setLoadingMessage(`Generando ejercicio de nivel ${difficulty}...`);
    setIsGeneratingExercise(true);

    try {
      // Preparar historial de conversación (últimos mensajes relevantes)
      const conversationHistory = messages
        .filter(msg => msg.type === "message" || msg.type === "notes")
        .slice(-5)
        .map(msg => ({
          role: msg.role,
          content: msg.content.substring(0, 2000) // Limitar longitud
        }));

      // Asegurar que siempre se envíe un tema si está disponible
      const topicsToSend = exerciseTopic 
        ? [exerciseTopic] 
        : (currentChatLevel?.topic ? [currentChatLevel.topic] : null);
      
      console.log("[generateExercise] Enviando topics al backend:", topicsToSend);
      
      const response = await fetch("/api/study-agents/generate-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeys.openai,
          difficulty,
          topics: topicsToSend,
          exercise_type: null,
          constraints: exerciseConstraints || null,
          model: selectedModel === "auto" ? null : selectedModel,
          conversationHistory: conversationHistory.length > 0 ? conversationHistory : null,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (data.success && data.exercise) {
        console.log("Ejercicio recibido:", JSON.stringify(data.exercise, null, 2));
        // Asegurar que el ejercicio tenga la estructura correcta
        // Si el ejercicio no tiene topics pero se pasó un tema, agregarlo
        const exerciseTopics = data.exercise.topics || [];
        const finalTopics = exerciseTopics.length > 0 
          ? exerciseTopics 
          : (exerciseTopic ? [exerciseTopic] : []);
        
        const exerciseData = {
          ...data.exercise,
          statement: data.exercise.statement || data.exercise.statement_text || "",
          hints: data.exercise.hints || [],
          points: data.exercise.points || 10,
          difficulty: data.exercise.difficulty || difficulty,
          topics: finalTopics, // Asegurar que siempre tenga el tema
          solution_steps: data.exercise.solution_steps || [],
          expected_answer: data.exercise.expected_answer || "",
          exercise_id: data.exercise.exercise_id || data.exerciseId || "",
        };
        
        console.log("Ejercicio procesado con topics:", finalTopics);
        console.log("Ejercicio procesado:", JSON.stringify(exerciseData, null, 2));
        setCurrentExercise(exerciseData);
        setExerciseAnswer("");
        setExerciseAnswerImage(null);
        setExerciseCorrection(null);

        // Calcular costo estimado
        let costEstimate: CostEstimate | undefined;
        if (data.inputTokens && data.outputTokens) {
          costEstimate = calculateCost(
            data.inputTokens,
            data.outputTokens,
            selectedModel
          );
        } else {
          const estimatedInput = estimateTokens(JSON.stringify(data.exercise));
          const estimatedOutput = estimateTokens(JSON.stringify(data.exercise));
          costEstimate = calculateCost(estimatedInput, estimatedOutput, selectedModel);
        }

        addMessage({
          role: "assistant",
          content: `Ejercicio generado`,
          type: "exercise",
          costEstimate,
        });
      } else {
        throw new Error(data.error || 'No se pudo generar el ejercicio');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error generando ejercicio";
      addMessage({
        role: "assistant",
        content: `Error: ${message}`,
        type: "message",
      });
    } finally {
      setIsGeneratingExercise(false);
      setIsLoading(false);
    }
  };

  const correctExercise = async () => {
    if (!currentExercise || (!exerciseAnswer.trim() && !exerciseAnswerImage) || !apiKeys?.openai) return;

    setIsLoading(true);
    setLoadingMessage("Corrigiendo ejercicio...");

    try {
      const response = await fetch("/api/study-agents/correct-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeys.openai,
          exercise: currentExercise,
          studentAnswer: exerciseAnswer,
          studentAnswerImage: exerciseAnswerImage,
          model: selectedModel === "auto" ? null : selectedModel,
          userId: userId, // Agregar userId para actualizar progreso
        }),
      });

      const data = await response.json();

      if (data.success && data.correction) {
        setExerciseCorrection(data.correction);


        // Verificar si subió de nivel
        if (data.progress_update) {
          const topic = data.progress_update.topic;
          const newLevel = data.progress_update.new_level;
          
          // Actualizar el indicador de nivel de la conversación
          if (data.progress_update.chat_id) {
            setCurrentChatLevel({ topic, level: newLevel });
          }
          
          // Actualizar niveles de todos los mensajes relacionados con este tema
          setMessageLevels(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(msgId => {
              if (updated[msgId].topic === topic) {
                updated[msgId] = { topic, level: newLevel };
              }
            });
            return updated;
          });
          
          const levelUp = data.progress_update.level_up || false;
          const levelDown = data.progress_update.level_down || false;
          const keyConcepts = data.progress_update.key_concepts || [];
          
          if (levelUp) {
            const expGained = data.progress_update.experience_gained || 0;
            const levelsChanged = data.progress_update.levels_changed || 1;
            const oldLevel = data.progress_update.old_level || 0;
            
            // Construir mensaje con conceptos clave a repasar
            let conceptsText = "";
            if (keyConcepts && keyConcepts.length > 0) {
              conceptsText = `\n\n📚 **Conceptos clave a repasar en este nivel:**\n${keyConcepts.map((c: string) => `• ${c}`).join("\n")}`;
            }
            
            // Mensaje diferente si subió 2 niveles
            const levelUpText = levelsChanged === 2 
              ? ` **¡Felicidades!** Has subido **2 niveles** (${oldLevel} → ${newLevel}) en **${topic}**! 🎉🎉`
              : ` **¡Felicidades!** Has subido al **nivel ${newLevel}** en **${topic}**!`;
            
            // Mostrar mensaje de felicitaciones con repaso de conceptos
            addMessage({
              role: "assistant",
              content: `${levelUpText}\n\n✨ Ganaste **${expGained} puntos de experiencia**.\n${conceptsText}\n\n💪 ¡Sigue así y continúa mejorando!`,
              type: "success",
            });
          } else if (levelDown) {
            // Mostrar mensaje de advertencia si bajó de nivel
            addMessage({
              role: "assistant",
              content: `⚠️ Has bajado al **nivel ${newLevel}** en **${topic}** debido a un resultado bajo.\n\n💡 Te recomiendo repasar los conceptos fundamentales antes de continuar. ¡No te desanimes, puedes recuperar tu nivel!`,
              type: "warning",
            });
          }
        }

        // Calcular costo estimado
        let costEstimate: CostEstimate | undefined;
        if (data.inputTokens && data.outputTokens) {
          costEstimate = calculateCost(
            data.inputTokens,
            data.outputTokens,
            selectedModel
          );
        }

        addMessage({
          role: "assistant",
          content: JSON.stringify(data.correction),
          type: "exercise_result",
          costEstimate,
        });
      } else {
        throw new Error(data.error || 'No se pudo corregir el ejercicio');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error corrigiendo ejercicio";
      addMessage({
        role: "assistant",
        content: `Error: ${message}`,
        type: "message",
      });
    } finally {
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
      // Obtener el tema del chat actual
      const chatTopic = currentChatLevel?.topic || null;
      
      // Llamar a la API con la key del usuario y el modelo seleccionado
      const response = await fetch("/api/study-agents/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeys.openai,
          question,
          uploadedFiles: uploadedFiles,
          model: selectedModel === "auto" ? null : selectedModel,
          userId: userId,
          chatId: currentChatId || currentChatIdRef.current,
          topic: chatTopic,
          initial_form_data: (initialFormData.level !== null || initialFormData.learningGoal || initialFormData.timeAvailable) ? initialFormData : null,
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
        
        // Detectar comprensión del tema basado en la pregunta y respuesta
        if (userId && question) {
          // Extraer tema de la pregunta (palabras clave comunes)
          const topicKeywords = [
            "sql", "python", "javascript", "react", "java", "c++", "html", "css",
            "base de datos", "database", "api", "programación", "algoritmo",
            "matemáticas", "física", "química", "biología", "historia",
            "japonés", "inglés", "español", "francés"
          ];
          
          const lowerQuestion = question.toLowerCase();
          const detectedTopic = topicKeywords.find(keyword => lowerQuestion.includes(keyword));
          
          if (detectedTopic) {
            // Calcular comprensión basado en si la respuesta es detallada y útil
            // Si la respuesta tiene más de 200 caracteres y contiene información útil, asumimos comprensión
            const understandingScore = data.answer && data.answer.length > 200 ? 0.3 : 0.1;
            
            // Actualizar progreso de comprensión (solo si hay comprensión significativa)
            if (understandingScore >= 0.2) {
              try {
                const understandingResponse = await fetch("/api/study-agents/update-chat-understanding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId,
                    topic: detectedTopic,
                    understandingScore: understandingScore,
                  }),
                });
                
                const understandingData = await understandingResponse.json();
                if (understandingData.success && understandingData.progress_update) {
                  const topic = understandingData.progress_update.topic;
                  const newLevel = understandingData.progress_update.new_level;
                  
                  // Actualizar el indicador de nivel de la conversación
                  if (understandingData.progress_update.chat_id) {
                    setCurrentChatLevel({ topic, level: newLevel });
                  }
                  
                  // Mostrar mensaje si subió de nivel
                  if (understandingData.progress_update.level_up) {
                    addMessage({
                      role: "assistant",
                      content: `🎉 ¡Felicitaciones! Has subido al nivel ${newLevel} en ${topic}! Sigue así!`,
                      type: "success",
                    });
                  }
                }
              } catch (error) {
                console.error("Error updating chat understanding:", error);
              }
            }
          }
        }
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
    } catch (error: unknown) {
      // Mostrar el error real en lugar de simulación
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar la pregunta';
      console.error('Error asking question:', error);
      
      addMessage({
        role: "assistant",
        content: `❌ Error de conexión:\n\n${errorMessage}\n\nVerifica que:\n- El backend FastAPI esté corriendo\n- La variable FASTAPI_URL esté configurada correctamente en Vercel\n- No haya problemas de red`,
        type: "message",
      });
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
      if (!currentTest || !currentTest.questions || currentTest.questions.length === 0) {
        addMessage({
          role: "assistant",
          content: "Error: No hay test disponible para evaluar",
          type: "message",
        });
        return;
      }

      const correctAnswers: Array<{ question: string; answer: string }> = [];
      const correctCount = Object.entries(testAnswers).filter(
        ([id, answer]) => {
          const question = currentTest.questions.find((q) => q.id === id);
          const isCorrect = question && question.correct_answer.toLowerCase().trim() === answer.toLowerCase().trim();
          if (isCorrect && question) {
            correctAnswers.push({
              question: question.question,
              answer: question.correct_answer,
            });
          }
          return isCorrect;
        }
      ).length;

      const totalQuestions = currentTest.questions.length;
      const score = (correctCount / totalQuestions) * 100;
      
      // Actualizar progreso del test
      if (userId) {
        // Intentar obtener el tema del test, o usar "General" como fallback
        let mainTopic = "General";
        if (currentTest.topics && currentTest.topics.length > 0) {
          mainTopic = currentTest.topics[0];
        } else {
          // Si no hay topics, intentar extraer tema de la conversación reciente
          const recentMessages = messages.slice(-5);
          for (const msg of recentMessages) {
            if (msg.role === "assistant" && msg.content) {
              const contentLower = msg.content.toLowerCase();
              if (contentLower.includes("sql")) {
                mainTopic = "SQL";
                break;
              } else if (contentLower.includes("python")) {
                mainTopic = "Python";
                break;
              } else if (contentLower.includes("javascript")) {
                mainTopic = "JavaScript";
                break;
              } else if (contentLower.includes("react")) {
                mainTopic = "React";
                break;
              } else if (contentLower.includes("japonés") || contentLower.includes("japones") || contentLower.includes("hiragana") || contentLower.includes("katakana") || contentLower.includes("kanji") || contentLower.includes("nihongo")) {
                mainTopic = "Japonés";
                break;
              } else if (contentLower.includes("api") || contentLower.includes("apis")) {
                mainTopic = "APIs";
                break;
              }
            }
          }
        }
        
        try {
          const chatIdToUse = currentChatId || currentChatIdRef.current;
          console.log(`📊 [Frontend] Actualizando progreso del test: tema=${mainTopic}, score=${score}%, userId=${userId}, chatId=${chatIdToUse}`);
          console.log(`📊 [Frontend] Score calculado: ${score}% (${correctCount}/${totalQuestions})`);
          const progressResponse = await fetch("/api/study-agents/update-test-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              topic: mainTopic,
              scorePercentage: score,
              chatId: chatIdToUse,  // Pasar chat_id en lugar de solo topic
            }),
          });
          
          console.log(`📊 [Frontend] Respuesta HTTP: status=${progressResponse.status}, ok=${progressResponse.ok}`);
          
          if (!progressResponse.ok) {
            const errorText = await progressResponse.text();
            console.error(`📊 [Frontend] Error en respuesta: ${errorText}`);
            throw new Error(`Error ${progressResponse.status}: ${errorText}`);
          }
          
          const progressData = await progressResponse.json();
          console.log("📊 [Frontend] Respuesta de actualización de progreso:", progressData);
          console.log("📊 [Frontend] level_up:", progressData.progress_update?.level_up);
          console.log("📊 [Frontend] levels_changed:", progressData.progress_update?.levels_changed);
          console.log("📊 [Frontend] old_level:", progressData.progress_update?.old_level);
          console.log("📊 [Frontend] new_level:", progressData.progress_update?.new_level);
          
          if (progressData.success && progressData.progress_update) {
            const topic = progressData.progress_update.topic;
            const newLevel = progressData.progress_update.new_level;
            const oldLevel = progressData.progress_update.old_level || 0;
            const totalExp = progressData.progress_update.total_experience || 0;
            const levelUp = progressData.progress_update.level_up || false;
            const levelDown = progressData.progress_update.level_down || false;
            const keyConcepts = progressData.progress_update.key_concepts || [];
            
            console.log(`📊 Progreso actualizado: ${topic} - Nivel ${oldLevel} → ${newLevel} (${totalExp} XP total)`);
            
            // Actualizar el indicador de nivel de la conversación
            setCurrentChatLevel({ topic, level: newLevel });
            
            // Actualizar niveles de todos los mensajes relacionados con este tema
            setMessageLevels(prev => {
              const updated = { ...prev };
              Object.keys(updated).forEach(msgId => {
                if (updated[msgId].topic === topic) {
                  updated[msgId] = { topic, level: newLevel };
                }
              });
              return updated;
            });
            
            // Mostrar mensaje de felicitaciones si subió de nivel
            if (levelUp) {
              const expGained = progressData.progress_update.experience_gained || 0;
              const levelsChanged = progressData.progress_update.levels_changed || 1;
              
              // Construir mensaje con conceptos clave a repasar
              let conceptsText = "";
              if (keyConcepts && keyConcepts.length > 0) {
                conceptsText = `\n\n📚 **Conceptos clave a repasar en este nivel:**\n${keyConcepts.map((c: string) => `• ${c}`).join("\n")}`;
              }
              
              // Mensaje diferente si subió 2 niveles
              const levelUpText = levelsChanged === 2 
                ? ` **¡Felicidades!** Has subido **2 niveles** (${oldLevel} → ${newLevel}) en **${topic}**! 🎉🎉`
                : ` **¡Felicidades!** Has subido al **nivel ${newLevel}** en **${topic}**!`;
              
              // Mostrar mensaje de felicitaciones con repaso de conceptos
              addMessage({
                role: "assistant",
                content: `${levelUpText}\n\n✨ Ganaste **${expGained} puntos de experiencia**.\n${conceptsText}\n\n💪 ¡Sigue así y continúa mejorando!`,
                type: "success",
              });
            } else if (levelDown) {
              // Mostrar mensaje de advertencia si bajó de nivel
              addMessage({
                role: "assistant",
                content: `⚠️ Has bajado al **nivel ${newLevel}** en **${topic}** debido a un resultado bajo.\n\n💡 Te recomiendo repasar los conceptos fundamentales antes de continuar. ¡No te desanimes, puedes recuperar tu nivel!`,
                type: "warning",
              });
            }
          }
        } catch (error) {
          console.error("Error updating test progress:", error);
        }
      }
      
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
          options: q.options || [],
          type: q.type,
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

    } catch {
      // Fallback con cálculo local
      if (!currentTest || !currentTest.questions || currentTest.questions.length === 0) {
        addMessage({
          role: "assistant",
          content: "Error: No hay test disponible para evaluar",
          type: "message",
        });
        return;
      }

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
          options: q.options || [],
          type: q.type,
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
    <>
      {/* Modal para crear nuevo chat */}
      {showNewChatModal && (
    <div
      style={{
            position: "fixed",
            top: 0,
            left: sidebarOpen ? (sidebarCollapsed ? "60px" : "280px") : "0",
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "3rem",
            paddingLeft: "6rem",
            paddingRight: "3rem",
            transition: "left 0.3s ease",
            overflow: "auto",
            boxSizing: "border-box",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewChatModal(false);
              setNewChatName("");
            }
          }}
        >
          <div
            style={{
              background: colorTheme === "dark" ? "rgba(26, 26, 36, 0.98)" : "rgba(255, 255, 255, 0.98)",
              border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.4)"}`,
              borderRadius: "28px",
              padding: "3rem",
              paddingLeft: "3.5rem",
              width: "calc(100% - 4rem)",
              maxWidth: "1400px",
              boxSizing: "border-box",
              maxHeight: "calc(100vh - 6rem)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              overflow: "hidden",
              margin: "0",
              marginLeft: "4rem",
              marginRight: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "2rem", borderBottom: `2px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.2)"}` }}>
              <h2
                className={spaceGrotesk.className}
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: colorTheme === "dark" ? "#f1f5f9" : "#0f172a",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Nuevo Chat
              </h2>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setNewChatName("");
                  setNewChatColor("#6366f1");
                  setNewChatIcon("chat");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colorTheme === "dark" ? "rgba(226, 232, 240, 0.7)" : "rgba(26, 36, 52, 0.7)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <XIcon size={24} />
              </button>
            </div>

            {/* Input manual (opcional) */}
            <div style={{ marginBottom: "2.5rem", paddingBottom: "2rem", borderBottom: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.12)" : "rgba(148, 163, 184, 0.18)"}` }}>
              <p
                className={outfit.className}
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: colorTheme === "dark" ? "rgba(226, 232, 240, 0.9)" : "rgba(15, 23, 42, 0.9)",
                  marginBottom: "1rem",
                  letterSpacing: "-0.01em",
                }}
              >
                O escribe un nombre personalizado:
              </p>
              <input
                type="text"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newChatName.trim()) {
                    handleCreateNewChat();
                  } else if (e.key === "Escape") {
                    setShowNewChatModal(false);
                    setNewChatName("");
                    setNewChatColor("#6366f1");
                    setNewChatIcon("chat");
                  }
                }}
                placeholder="Nombre del chat..."
                className={outfit.className}
                style={{
                  width: "100%",
                  padding: "1rem 1.25rem",
                  background: colorTheme === "dark" ? "rgba(30, 41, 59, 0.6)" : "rgba(248, 250, 252, 0.8)",
                  border: `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.25)"}`,
                  borderRadius: "14px",
                  color: colorTheme === "dark" ? "#f1f5f9" : "#0f172a",
                  fontSize: "1rem",
                  fontWeight: 500,
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(99, 102, 241, 0.6)" : "rgba(99, 102, 241, 0.5)";
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)"}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.25)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {newChatName.trim() && (
                <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => handleCreateNewChat()}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      border: "none",
                      borderRadius: "16px",
                      color: "white",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    Crear chat personalizado
                  </button>
                </div>
              )}
            </div>

            {/* Sugerencias organizadas por secciones */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: "1rem",
                paddingLeft: "0",
                marginRight: "0",
                marginLeft: "0",
                marginBottom: "1rem",
                maxHeight: "calc(100vh - 420px)",
                scrollbarWidth: "thin",
                scrollbarColor: `${colorTheme === "dark" ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.5)"} ${colorTheme === "dark" ? "rgba(30, 41, 59, 0.3)" : "rgba(241, 245, 249, 0.5)"}`,
              }}
              className="topic-suggestions-scroll"
            >
              <style dangerouslySetInnerHTML={{__html: `
                .topic-suggestions-scroll::-webkit-scrollbar {
                  width: 12px;
                }
                .topic-suggestions-scroll::-webkit-scrollbar-track {
                  background: ${colorTheme === "dark" ? "rgba(30, 41, 59, 0.2)" : "rgba(241, 245, 249, 0.4)"};
                  border-radius: 12px;
                  margin: 8px 0;
                }
                .topic-suggestions-scroll::-webkit-scrollbar-thumb {
                  background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.5)"};
                  border-radius: 12px;
                  border: 3px solid ${colorTheme === "dark" ? "rgba(30, 41, 59, 0.2)" : "rgba(241, 245, 249, 0.4)"};
                  transition: background 0.2s ease;
                }
                .topic-suggestions-scroll::-webkit-scrollbar-thumb:hover {
                  background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.6)" : "rgba(148, 163, 184, 0.7)"};
                }
              `}} />
              <style>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              <p
                className={outfit.className}
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: colorTheme === "dark" ? "#f1f5f9" : "#0f172a",
                  marginBottom: "2rem",
                }}
              >
                O selecciona una sugerencia:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "2rem", paddingRight: "0", paddingLeft: "0", width: "100%", boxSizing: "border-box" }}>
                {topicSuggestions.map((section) => {
                  const isExpanded = expandedSections.has(section.name);
                  return (
                    <div key={section.name} style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                      {/* Header de sección - clickeable para expandir/colapsar */}
                      <button
                        onClick={() => {
                          setExpandedSections(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(section.name)) {
                              newSet.delete(section.name);
                            } else {
                              newSet.add(section.name);
                            }
                            return newSet;
                          });
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1.25rem",
                          padding: "1rem 1.25rem",
                          border: `2px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.2)"}`,
                          background: colorTheme === "dark" 
                            ? `linear-gradient(90deg, ${section.color}12 0%, transparent 100%)`
                            : `linear-gradient(90deg, ${section.color}08 0%, transparent 100%)`,
                          borderRadius: "16px",
                          marginBottom: "0",
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colorTheme === "dark" 
                            ? `linear-gradient(90deg, ${section.color}20 0%, transparent 100%)`
                            : `linear-gradient(90deg, ${section.color}15 0%, transparent 100%)`;
                          e.currentTarget.style.borderColor = section.color + "60";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colorTheme === "dark" 
                            ? `linear-gradient(90deg, ${section.color}12 0%, transparent 100%)`
                            : `linear-gradient(90deg, ${section.color}08 0%, transparent 100%)`;
                          e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.2)";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flex: 1 }}>
                          <div
                            style={{
                              width: "52px",
                              height: "52px",
                              borderRadius: "14px",
                              background: section.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              boxShadow: `0 6px 16px ${section.color}60`,
                            }}
                          >
                            {getSectionIcon(section.name)}
                          </div>
                          <h3
                            className={spaceGrotesk.className}
                            style={{
                              fontSize: "1.35rem",
                              fontWeight: 700,
                              letterSpacing: "-0.015em",
                              color: colorTheme === "dark" ? "#f1f5f9" : "#0f172a",
                              margin: 0,
                              lineHeight: 1.3,
                            }}
                          >
                            {section.name}
                          </h3>
                        </div>
                        <HiChevronDown
                          size={24}
                          color={colorTheme === "dark" ? "#f1f5f9" : "#0f172a"}
                          style={{
                            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            flexShrink: 0,
                          }}
                        />
                      </button>
                      {/* Grid de temas - se muestra solo si está expandido */}
                      {isExpanded && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: "1.25rem",
                            width: "100%",
                            boxSizing: "border-box",
                            paddingTop: "1.5rem",
                            animation: "fadeIn 0.3s ease-in-out",
                          }}
                        >
                        {section.topics.map((topic) => {
                          const topicColor = section.color;
                          const topicIcon = getTopicIcon(topic);
                          const isLanguage = isLanguageTopic(topic);
                          return (
                            <button
                              key={topic}
                              onClick={() => {
                                setNewChatColor(topicColor);
                                const topicIconIdentifier = getTopicIconIdentifier(topic);
                                setNewChatIcon(topicIconIdentifier);
                                handleCreateNewChat(topic, topicColor, topicIconIdentifier);
                              }}
                              className={outfit.className}
                              style={{
                                padding: "1.5rem 1.25rem",
                                background: colorTheme === "dark" 
                                  ? `linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.3))`
                                  : `linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8))`,
                                border: `2px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.2)"}`,
                                borderRadius: "16px",
                                color: colorTheme === "dark" ? "#f1f5f9" : "#0f172a",
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                position: "relative",
                                overflow: "hidden",
                                boxSizing: "border-box",
                                width: "100%",
                                boxShadow: colorTheme === "dark" 
                                  ? "0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)"
                                  : "0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${topicColor}20, ${topicColor}10)`;
                                e.currentTarget.style.borderColor = topicColor;
                                e.currentTarget.style.transform = "translateY(-5px) scale(1.02)";
                                e.currentTarget.style.boxShadow = `0 12px 32px ${topicColor}50, 0 0 0 1px ${topicColor}30`;
                                e.currentTarget.style.color = topicColor;
                                const iconContainer = e.currentTarget.querySelector('.topic-icon-container') as HTMLElement;
                                const iconDiv = iconContainer?.querySelector('div') as HTMLElement;
                                if (iconContainer) {
                                  if (isLanguage) {
                                    iconContainer.style.transform = "scale(1.1)";
                                    iconContainer.style.boxShadow = `0 6px 20px rgba(0, 0, 0, 0.2)`;
                                  } else {
                                    iconContainer.style.background = topicColor;
                                    iconContainer.style.borderColor = topicColor;
                                    iconContainer.style.transform = "scale(1.2) rotate(8deg)";
                                    iconContainer.style.boxShadow = `0 6px 16px ${topicColor}90`;
                                  }
                                }
                                if (iconDiv && !isLanguage) {
                                  iconDiv.style.color = "white";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = colorTheme === "dark" 
                                  ? `linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.3))`
                                  : `linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8))`;
                                e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.2)";
                                e.currentTarget.style.transform = "translateY(0) scale(1)";
                                e.currentTarget.style.boxShadow = colorTheme === "dark" 
                                  ? "0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)"
                                  : "0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)";
                                e.currentTarget.style.color = colorTheme === "dark" ? "#f1f5f9" : "#0f172a";
                                const iconContainer = e.currentTarget.querySelector('.topic-icon-container') as HTMLElement;
                                const iconDiv = iconContainer?.querySelector('div') as HTMLElement;
                                if (iconContainer) {
                                  if (isLanguage) {
                                    iconContainer.style.transform = "scale(1)";
                                    iconContainer.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                                  } else {
                                    iconContainer.style.background = topicColor + "20";
                                    iconContainer.style.borderColor = topicColor + "40";
                                    iconContainer.style.transform = "scale(1) rotate(0deg)";
                                    iconContainer.style.boxShadow = "none";
                                  }
                                }
                                if (iconDiv && !isLanguage) {
                                  iconDiv.style.color = topicColor;
                                }
                              }}
                            >
                              <div
                                className="topic-icon-container"
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  minWidth: "48px",
                                  borderRadius: isLanguage ? "12px" : "14px",
                                  background: isLanguage ? "transparent" : (topicColor + "20"),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  border: isLanguage ? "none" : `2px solid ${topicColor}40`,
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  padding: isLanguage ? "0" : "4px",
                                  overflow: isLanguage ? "hidden" : "visible",
                                  position: "relative",
                                  boxShadow: isLanguage ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "none",
                                }}
                              >
                                <div style={{ 
                                  color: topicColor, 
                                  transition: "color 0.3s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: isLanguage ? "48px" : "40px",
                                  height: isLanguage ? "48px" : "40px",
                                  position: "relative",
                                  lineHeight: 0,
                                }}>
                                  {topicIcon}
                                </div>
                              </div>
                              <span style={{ flex: 1, textAlign: "left", lineHeight: 1.6, fontWeight: 600, letterSpacing: "-0.01em" }}>{topic}</span>
                            </button>
                          );
                        })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => {
          setSidebarOpen(!sidebarOpen);
          if (!sidebarOpen) {
            // Si se está cerrando, resetear el estado de colapsado
            setSidebarCollapsed(false);
          }
        }}
        onSelectChat={loadChat}
        currentChatId={currentChatId}
        onNewChat={createNewChat}
        colorTheme={colorTheme}
        onCollapsedChange={setSidebarCollapsed}
      />
      {/* Premium Background Effects - Full Screen (Fixed Position) */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? (sidebarCollapsed ? "60px" : "280px") : "0",
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          transition: "left 0.3s ease",
          overflow: 'visible',
        }}
      >
        {/* Subtle Orbs - Full Screen */}
        <div 
          className="absolute rounded-full blur-[120px] opacity-8"
          style={{
            width: '600px',
            height: '600px',
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            top: "5%",
            left: "10%",
            animation: "floatOrbMain1 45s ease-in-out infinite",
          }}
        />
        <div 
          className="absolute rounded-full blur-[100px] opacity-6"
          style={{
            width: '500px',
            height: '500px',
            background: "linear-gradient(135deg, #a855f7, #6366f1)",
            bottom: "10%",
            right: "10%",
            animation: "floatOrbMain2 55s ease-in-out infinite reverse",
          }}
        />
        <div 
          className="absolute rounded-full blur-[90px] opacity-5"
          style={{
            width: '450px',
            height: '450px',
            background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
            top: "50%",
            left: "50%",
            transform: 'translate(-50%, -50%)',
            animation: "floatOrbMain3 60s ease-in-out infinite",
          }}
        />

        {/* Full Screen Grid Pattern */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 40%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 40%, transparent 70%)',
          }}
        />

        {/* Full Screen Rising Lines */}
        {[...Array(15)].map((_, i) => {
          const seed = i * 11 + 7;
          const width = (seed % 15) / 10 + 0.5;
          const height = (seed % 200) + 150;
          const left = (seed * 13) % 100;
          const duration = (seed % 60) / 10 + 8;
          const delay = (seed % 40) / 10;
          const opacity = (seed % 30) / 100 + 0.1;
          const colorVariant = seed % 2 === 0 ? '99, 102, 241' : '139, 92, 246';
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${width}px`,
                height: `${height}px`,
                background: `linear-gradient(to top, rgba(${colorVariant}, 0), rgba(${colorVariant}, ${opacity}))`,
                left: `${left}%`,
                bottom: '-200px',
                borderRadius: '2px',
                animation: `riseLineChat ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                boxShadow: `0 0 ${(seed % 80) / 10 + 3}px rgba(${colorVariant}, 0.2)`,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          marginLeft: sidebarOpen ? (sidebarCollapsed ? "60px" : "280px") : "0",
          transition: "margin-left 0.3s ease",
          minHeight: "calc(100vh - 50vh)",
          background: colorTheme === "light" 
            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)" 
            : "linear-gradient(180deg, rgba(18, 18, 26, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
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
      
      {/* Selector de Tema y Modelo Global - Premium Design */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "1rem 1.5rem",
        gap: "0.75rem",
        background: colorTheme === "dark" 
          ? "rgba(26, 26, 36, 0.6)" 
          : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.25)"}`,
        flexWrap: "wrap",
        position: "relative",
        zIndex: 10,
        boxShadow: colorTheme === "dark"
          ? "0 2px 8px rgba(0, 0, 0, 0.1)"
          : "0 2px 8px rgba(0, 0, 0, 0.05)",
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
              <div
              ref={modelDropdownRef}
              style={{ position: "relative", display: "inline-block" }}
            >
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1rem",
                  paddingRight: "2rem",
                  background: colorTheme === "dark"
                    ? "rgba(99, 102, 241, 0.1)"
                    : "rgba(99, 102, 241, 0.08)",
                  border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.25)"}`,
                  borderRadius: "8px",
                  color: colorTheme === "dark" ? "#e2e8f0" : "#1a1a24",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colorTheme === "dark"
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(99, 102, 241, 0.12)";
                  e.currentTarget.style.borderColor = colorTheme === "dark"
                    ? "rgba(99, 102, 241, 0.4)"
                    : "rgba(99, 102, 241, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colorTheme === "dark"
                    ? "rgba(99, 102, 241, 0.1)"
                    : "rgba(99, 102, 241, 0.08)";
                  e.currentTarget.style.borderColor = colorTheme === "dark"
                    ? "rgba(99, 102, 241, 0.3)"
                    : "rgba(99, 102, 241, 0.25)";
                }}
              >
                <span>
                  {selectedModel === "auto" ? "Automático (Optimiza Costes)" :
                   selectedModel === "gpt-5" ? "GPT-5" :
                   selectedModel === "gpt-4o" ? "GPT-4o" :
                   selectedModel === "llama3.1" ? "Llama 3.1" :
                 selectedModel}
                </span>
                <span style={{
                  fontSize: "0.625rem",
                  transform: showModelDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  display: "inline-block",
                }}>
                  ▼
                </span>
              </button>
              
              {showModelDropdown && (
                <div 
                  className="model-dropdown-scroll"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                style={{
                    position: "absolute",
                    top: "calc(100% + 0.5rem)",
                    left: 0,
                    background: colorTheme === "dark" 
                      ? "rgba(26, 26, 36, 0.95)" 
                      : "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderRadius: "12px",
                    padding: "0.375rem",
                    minWidth: "260px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    boxShadow: colorTheme === "dark"
                      ? "0 8px 32px rgba(0, 0, 0, 0.4)"
                      : "0 8px 32px rgba(0, 0, 0, 0.15)",
                    border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(148, 163, 184, 0.2)"}`,
                    zIndex: 10000,
                    scrollbarWidth: "thin",
                    scrollbarColor: `${colorTheme === "dark" ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.5)"} ${colorTheme === "dark" ? "rgba(26, 26, 36, 0.3)" : "rgba(255, 255, 255, 0.3)"}`,
                    pointerEvents: "auto",
                }}
                >
                  <style dangerouslySetInnerHTML={{__html: `
                    .model-dropdown-scroll::-webkit-scrollbar {
                      width: 6px;
                    }
                    .model-dropdown-scroll::-webkit-scrollbar-track {
                      background: ${colorTheme === "dark" ? "rgba(26, 26, 36, 0.2)" : "rgba(241, 245, 249, 0.4)"};
                      border-radius: 6px;
                    }
                    .model-dropdown-scroll::-webkit-scrollbar-thumb {
                      background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.5)"};
                      border-radius: 6px;
                      border: 1px solid ${colorTheme === "dark" ? "rgba(26, 26, 36, 0.2)" : "rgba(255, 255, 255, 0.3)"};
                    }
                    .model-dropdown-scroll::-webkit-scrollbar-thumb:hover {
                      background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.6)" : "rgba(148, 163, 184, 0.7)"};
                    }
                  `}} />
                {(() => {
                  // Función para obtener el precio por 1000 tokens (entrada + salida)
                    const getPricePer1K = (modelKey: string): number => {
                    const pricing = MODEL_PRICING[modelKey.toLowerCase()] || MODEL_PRICING["gpt-4-turbo"];
                      return pricing.input + pricing.output;
                    };
                    
                    const formatPrice = (price: number): string => {
                      return formatCost(price);
                    };
                    
                    const models = [
                      { value: "auto", label: "Automático", subtitle: "Optimiza Costes", price: null, priceValue: 0 },
                      { value: "gpt-5", label: "GPT-5", subtitle: null, price: null, priceValue: getPricePer1K("gpt-5") },
                      { value: "gpt-4o", label: "GPT-4o", subtitle: null, price: null, priceValue: getPricePer1K("gpt-4o") },
                      { value: "llama3.1", label: "Llama 3.1", subtitle: "Gratis", price: "Gratis", priceValue: 0 },
                    ];
                    
                    // Ordenar por precio (Automático primero, luego modelos de pago, luego gratis)
                    const sortedModels = models.sort((a, b) => {
                      if (a.value === "auto") return -1; // Automático siempre primero
                      if (b.value === "auto") return 1;
                      // Modelos gratis (precio 0) al final
                      if (a.priceValue === 0 && b.priceValue > 0) return 1;
                      if (b.priceValue === 0 && a.priceValue > 0) return -1;
                      // Ordenar modelos de pago por precio ascendente
                      return a.priceValue - b.priceValue;
                    });
                    
                    // Formatear precios después de ordenar
                    sortedModels.forEach(model => {
                      if (model.priceValue > 0) {
                        model.price = formatPrice(model.priceValue);
                      }
                    });
                  
                    return sortedModels.map((model) => {
                      const isSelected = selectedModel === model.value;
                  return (
                        <button
                          key={model.value}
                          onClick={() => {
                            setSelectedModel(model.value);
                            setShowModelDropdown(false);
                          }}
                style={{
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            background: isSelected
                              ? (colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.15)")
                              : "transparent",
                            border: "none",
                            borderRadius: "8px",
                  color: colorTheme === "dark" ? "#e2e8f0" : "#1a1a24",
                            fontSize: "0.8125rem",
                            fontWeight: isSelected ? 600 : 500,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.5rem",
                            marginBottom: "0.125rem",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = colorTheme === "dark"
                                ? "rgba(99, 102, 241, 0.1)"
                                : "rgba(99, 102, 241, 0.08)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem", flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: "0.8125rem" }}>{model.label}</span>
                            {(model.subtitle || model.price) && (
                              <span style={{
                                fontSize: "0.6875rem",
                                color: colorTheme === "dark" ? "#94a3b8" : "#64748b",
                                fontWeight: 400,
                              }}>
                                {model.subtitle || `${model.price}/1K tokens`}
                              </span>
                            )}
              </div>
                          {isSelected && (
                            <HiCheck size={14} color="#6366f1" style={{ flexShrink: 0 }} />
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
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
          title="Tema oscuro"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            background: colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
            borderRadius: "24px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colorTheme === "dark" 
              ? "rgba(99, 102, 241, 0.15)" 
              : "rgba(99, 102, 241, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colorTheme === "dark" 
              ? "rgba(99, 102, 241, 0.1)" 
              : "rgba(99, 102, 241, 0.08)";
          }}
        >
          <MoonIcon size={18} />
        </button>
        <button
          onClick={() => setColorTheme("light")}
          title="Tema claro"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            background: colorTheme === "light" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
            borderRadius: "24px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colorTheme === "light" 
              ? "rgba(99, 102, 241, 0.15)" 
              : "rgba(99, 102, 241, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colorTheme === "light" 
              ? "rgba(99, 102, 241, 0.1)" 
              : "rgba(99, 102, 241, 0.08)";
          }}
        >
          <SunIcon size={18} />
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
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="messages-container-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            marginBottom: "1rem",
            padding: "1rem",
            paddingBottom: "2rem",
            position: "relative",
            zIndex: 1,
            scrollbarWidth: "thin",
            scrollbarColor: `${colorTheme === "dark" ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.5)"} ${colorTheme === "dark" ? "rgba(26, 26, 36, 0.3)" : "rgba(255, 255, 255, 0.3)"}`,
          }}
        >
          {showInitialForm && (
            <div
              style={{
                maxWidth: "600px",
                margin: "1.5rem auto",
                padding: "1.75rem",
                background: colorTheme === "dark" 
                  ? "rgba(26, 26, 36, 0.95)"
                  : "#ffffff",
                borderRadius: "12px",
                border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)"}`,
                boxShadow: colorTheme === "dark" 
                  ? "0 4px 16px rgba(0, 0, 0, 0.2)"
                  : "0 4px 16px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: "0.5rem",
                  color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                  lineHeight: 1.4,
                }}>
                  Información inicial
                </h2>
                <p style={{
                  fontSize: "1.05rem",
                  color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  Opcional • Ayuda a personalizar tus respuestas
                </p>
              </div>
              
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "1.25rem",
              }}>
                {/* Pregunta 1: Nivel */}
                <div>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontSize: "1.05rem",
                    fontWeight: 500,
                    marginBottom: "0.75rem",
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    lineHeight: 1.5,
                  }}>
                    <TargetIcon size={20} color={colorTheme === "dark" ? "#6366f1" : "#6366f1"} />
                    Nivel (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={initialFormData.level ?? ""}
                    onChange={(e) => setInitialFormData({
                      ...initialFormData,
                      level: e.target.value ? parseInt(e.target.value) : null,
                    })}
                    placeholder="Ej: 3"
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      borderRadius: "8px",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)"}`,
                      background: colorTheme === "dark" ? "rgba(26, 26, 36, 0.5)" : "#ffffff",
                      color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                      fontSize: "1.1rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Pregunta 2: Objetivo */}
                <div>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontSize: "1.05rem",
                    fontWeight: 500,
                    marginBottom: "0.75rem",
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    lineHeight: 1.5,
                  }}>
                    <LightbulbIcon size={20} color={colorTheme === "dark" ? "#6366f1" : "#6366f1"} />
                    ¿Para qué quieres aprender {currentChatLevel?.topic || "este tema"}?
                  </label>
                  <textarea
                    value={initialFormData.learningGoal}
                    onChange={(e) => setInitialFormData({
                      ...initialFormData,
                      learningGoal: e.target.value,
                    })}
                    placeholder="Ej: Voy a vivir en Japón en un año y quiero aprender japonés para comunicarme"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      borderRadius: "8px",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)"}`,
                      background: colorTheme === "dark" ? "rgba(26, 26, 36, 0.5)" : "#ffffff",
                      color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                      fontSize: "1.1rem",
                      resize: "vertical",
                      fontFamily: "inherit",
                      transition: "all 0.2s ease",
                      outline: "none",
                      lineHeight: 1.6,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Pregunta 3: Tiempo disponible */}
                <div>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontSize: "1.05rem",
                    fontWeight: 500,
                    marginBottom: "0.75rem",
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    lineHeight: 1.5,
                  }}>
                    <HiClock size={20} color={colorTheme === "dark" ? "#6366f1" : "#6366f1"} />
                    ¿Cuánto tiempo tienes?
                  </label>
                  <input
                    type="text"
                    value={initialFormData.timeAvailable}
                    onChange={(e) => setInitialFormData({
                      ...initialFormData,
                      timeAvailable: e.target.value,
                    })}
                    placeholder="Ej: 1 semana, 1 mes, 1 año"
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      borderRadius: "8px",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)"}`,
                      background: colorTheme === "dark" ? "rgba(26, 26, 36, 0.5)" : "#ffffff",
                      color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                      fontSize: "1.1rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Botones */}
                <div style={{ 
                  display: "flex", 
                  gap: "0.75rem", 
                  justifyContent: "flex-end", 
                  marginTop: "0.75rem",
                }}>
                  <button
                    onClick={() => {
                      setShowInitialForm(false);
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.4)"}`,
                      background: "transparent",
                      color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                      fontSize: "1.05rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Omitir
                  </button>
                  <button
                    onClick={async () => {
                      // Guardar respuestas en metadata del chat
                      if (currentChatId && userId) {
                        try {
                          // Obtener chat actual
                          const loadResponse = await fetch("/api/study-agents/load-chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId, chatId: currentChatId }),
                          });
                          
                          if (loadResponse.ok) {
                            const chatData = await loadResponse.json();
                            const currentMetadata = chatData.chat?.metadata || {};
                            
                            // Actualizar metadata con las respuestas del formulario
                            const updatedMetadata = {
                              ...currentMetadata,
                              initialForm: initialFormData,
                            };
                            
                            // Guardar chat actualizado
                            await fetch("/api/study-agents/save-chat", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                userId,
                                chatId: currentChatId,
                                title: chatData.chat?.title || "Nueva conversación",
                                messages: chatData.chat?.messages || [],
                                metadata: updatedMetadata,
                              }),
                            });
                            
                            // Si hay nivel, actualizarlo también
                            if (initialFormData.level !== null) {
                              await fetch("/api/study-agents/set-chat-level", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  userId,
                                  chatId: currentChatId,
                                  level: initialFormData.level,
                                  topic: currentChatLevel?.topic || chatData.chat?.metadata?.topic || null,
                                }),
                              });
                              setCurrentChatLevel(prev => prev ? { ...prev, level: initialFormData.level! } : null);
                            }
                          }
                        } catch (error) {
                          console.error("Error guardando formulario:", error);
                        }
                      }
                      
                      setShowInitialForm(false);
                    }}
                    style={{
                      padding: "0.75rem 1.75rem",
                      borderRadius: "8px",
                      border: "none",
                      background: "#6366f1",
                      color: "white",
                      fontSize: "1.05rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#4f46e5";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#6366f1";
                    }}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          )}

          {messages.length === 0 && !showInitialForm && (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 1rem 3rem",
                color: "var(--text-secondary)",
                maxWidth: "1000px",
                margin: "0 auto",
              }}
            >
              <div style={{ marginBottom: "2.5rem" }}>
                <h3
                  className={spaceGrotesk.className}
                  style={{
                    fontSize: "clamp(2rem, 5vw, 2.75rem)",
                    marginBottom: "1rem",
                    fontWeight: 700,
                    background: colorTheme === "dark"
                      ? "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)"
                      : "linear-gradient(135deg, #1a1a24 0%, #6366f1 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  ¡Hola! Soy tu asistente de estudio
                </h3>
                <p 
                  className={outfit.className} 
                  style={{ 
                    fontSize: "1.125rem",
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    maxWidth: "600px",
                    margin: "0 auto",
                    lineHeight: 1.6,
                  }}
                >
                  Te ayudo a aprender de manera eficiente. Sube documentos, genera apuntes, haz preguntas y evalúa tu conocimiento.
                </p>
              </div>
              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "1.5rem",
                  maxWidth: "1100px",
                  margin: "0 auto",
                }}
              >
                {/* Tarjeta 1: Sube documentos - Premium Design */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "2rem 1.5rem",
                    background: colorTheme === "dark"
                      ? "linear-gradient(135deg, rgba(26, 26, 36, 0.8), rgba(30, 30, 45, 0.6))"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))",
                    borderRadius: "20px",
                    border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.25)" : "rgba(99, 102, 241, 0.2)"}`,
                    boxShadow: colorTheme === "dark"
                      ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                      : "0 8px 32px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(99, 102, 241, 0.6)" : "rgba(99, 102, 241, 0.4)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 16px 48px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 16px 48px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.9)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(99, 102, 241, 0.25)" : "rgba(99, 102, 241, 0.2)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                      : "0 8px 32px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)";
                  }}
                >
                  {/* Premium Shimmer Effect */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)",
                      transition: "left 0.6s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.left = "100%";
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  }} />
                  <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      padding: "1rem",
                      background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))",
                      borderRadius: "12px",
                      display: "inline-flex",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.2)"}`,
                    }}>
                      <FileIcon size={28} color="#6366f1" />
                    </div>
                  </div>
                  <strong style={{ 
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    fontSize: "1.25rem",
                    display: "block",
                    marginBottom: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}>Sube documentos</strong>
                  <p style={{ 
                    fontSize: "0.9375rem", 
                    marginTop: "0.5rem", 
                    opacity: 0.9,
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    lineHeight: 1.6,
                  }}>
                    Arrastra PDFs para procesarlos y crear tu base de conocimiento
                  </p>
                </div>

                {/* Tarjeta 2: Genera apuntes - Premium Design */}
                <div
                  onClick={async () => {
                    await generateNotes();
                  }}
                  style={{
                    padding: "2rem 1.5rem",
                    background: colorTheme === "dark"
                      ? "linear-gradient(135deg, rgba(26, 26, 36, 0.8), rgba(30, 30, 45, 0.6))"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))",
                    borderRadius: "20px",
                    border: `1px solid ${colorTheme === "dark" ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.2)"}`,
                    boxShadow: colorTheme === "dark"
                      ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                      : "0 8px 32px rgba(16, 185, 129, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(16, 185, 129, 0.6)" : "rgba(16, 185, 129, 0.4)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 16px 48px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 16px 48px rgba(16, 185, 129, 0.2), 0 0 0 1px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.9)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.2)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                      : "0 8px 32px rgba(16, 185, 129, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)";
                  }}
                >
                  {/* Premium Shimmer Effect */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent)",
                      transition: "left 0.6s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.left = "100%";
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "linear-gradient(90deg, #10b981, #059669)",
                  }} />
                  <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      padding: "1rem",
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))",
                      borderRadius: "12px",
                      display: "inline-flex",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)"}`,
                    }}>
                      <NotesIcon size={28} color="#10b981" />
                    </div>
                  </div>
                  <strong style={{ 
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    fontSize: "1.25rem",
                    display: "block",
                    marginBottom: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}>Genera apuntes</strong>
                  <p style={{ 
                    fontSize: "0.9375rem", 
                    marginTop: "0.5rem", 
                    opacity: 0.9,
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    lineHeight: 1.6,
                  }}>
                    Crea apuntes estructurados con esquemas y diagramas interactivos
                  </p>
                </div>

                {/* Tarjeta 3: Haz preguntas - Premium Design */}
                <div
                  onClick={() => {
                    textareaRef.current?.focus();
                    scrollToBottom();
                  }}
                  style={{
                    padding: "2rem 1.5rem",
                    background: colorTheme === "dark"
                      ? "linear-gradient(135deg, rgba(26, 26, 36, 0.8), rgba(30, 30, 45, 0.6))"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))",
                    borderRadius: "20px",
                    border: `1px solid ${colorTheme === "dark" ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.2)"}`,
                    boxShadow: colorTheme === "dark"
                      ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                      : "0 8px 32px rgba(245, 158, 11, 0.12), 0 0 0 1px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(245, 158, 11, 0.6)" : "rgba(245, 158, 11, 0.4)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 16px 48px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 16px 48px rgba(245, 158, 11, 0.2), 0 0 0 1px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.9)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.2)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                      : "0 8px 32px rgba(245, 158, 11, 0.12), 0 0 0 1px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)";
                  }}
                >
                  {/* Premium Shimmer Effect */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.1), transparent)",
                      transition: "left 0.6s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.left = "100%";
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "linear-gradient(90deg, #f59e0b, #d97706)",
                  }} />
                  <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      padding: "1rem",
                      background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15))",
                      borderRadius: "12px",
                      display: "inline-flex",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.2)"}`,
                    }}>
                      <QuestionIcon size={28} color="#f59e0b" />
                    </div>
                  </div>
                  <strong style={{ 
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    fontSize: "1.25rem",
                    display: "block",
                    marginBottom: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}>Haz preguntas</strong>
                  <p style={{ 
                    fontSize: "0.9375rem", 
                    marginTop: "0.5rem", 
                    opacity: 0.9,
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    lineHeight: 1.6,
                  }}>
                    Pregunta sobre cualquier tema y obtén respuestas precisas con RAG
                  </p>
                </div>

                {/* Tarjeta 4: Genera tests - Premium Design */}
                <div
                  onClick={async () => {
                    await generateTest();
                  }}
                  style={{
                    padding: "2rem 1.5rem",
                    background: colorTheme === "dark"
                      ? "linear-gradient(135deg, rgba(26, 26, 36, 0.8), rgba(30, 30, 45, 0.6))"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))",
                    borderRadius: "20px",
                    border: `1px solid ${colorTheme === "dark" ? "rgba(236, 72, 153, 0.25)" : "rgba(236, 72, 153, 0.2)"}`,
                    boxShadow: colorTheme === "dark"
                      ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(236, 72, 153, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                      : "0 8px 32px rgba(236, 72, 153, 0.12), 0 0 0 1px rgba(236, 72, 153, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(236, 72, 153, 0.6)" : "rgba(236, 72, 153, 0.4)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 16px 48px rgba(236, 72, 153, 0.4), 0 0 0 1px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 16px 48px rgba(236, 72, 153, 0.2), 0 0 0 1px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.9)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(236, 72, 153, 0.25)" : "rgba(236, 72, 153, 0.2)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(236, 72, 153, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                      : "0 8px 32px rgba(236, 72, 153, 0.12), 0 0 0 1px rgba(236, 72, 153, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)";
                  }}
                >
                  {/* Premium Shimmer Effect */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.1), transparent)",
                      transition: "left 0.6s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.left = "100%";
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "linear-gradient(90deg, #ec4899, #db2777)",
                  }} />
                  <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      padding: "1rem",
                      background: "linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.15))",
                      borderRadius: "12px",
                      display: "inline-flex",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(236, 72, 153, 0.3)" : "rgba(236, 72, 153, 0.2)"}`,
                    }}>
                      <TestIcon size={28} color="#ec4899" />
                    </div>
                  </div>
                  <strong style={{ 
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    fontSize: "1.25rem",
                    display: "block",
                    marginBottom: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}>Genera tests</strong>
                  <p style={{ 
                    fontSize: "0.9375rem", 
                    marginTop: "0.5rem", 
                    opacity: 0.9,
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    lineHeight: 1.6,
                  }}>
                    Crea tests personalizados con corrección automática y feedback
                  </p>
                </div>

                {/* Tarjeta 5: Genera ejercicios */}
                <div
                  onClick={async () => {
                    await generateExercise();
                  }}
                  style={{
                    padding: "2rem 1.5rem",
                    background: colorTheme === "dark"
                      ? "rgba(26, 26, 36, 0.6)"
                      : "rgba(255, 255, 255, 0.9)",
                    borderRadius: "16px",
                    border: `1px solid ${colorTheme === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.15)"}`,
                    boxShadow: colorTheme === "dark"
                      ? "0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)"
                      : "0 4px 20px rgba(139, 92, 246, 0.08), 0 0 0 1px rgba(139, 92, 246, 0.1)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(139, 92, 246, 0.3)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 8px 30px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.2)"
                      : "0 8px 30px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.15)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)"
                      : "0 4px 20px rgba(139, 92, 246, 0.08), 0 0 0 1px rgba(139, 92, 246, 0.1)";
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "linear-gradient(90deg, #8b5cf6, #7c3aed)",
                  }} />
                  <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      padding: "1rem",
                      background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.15))",
                      borderRadius: "12px",
                      display: "inline-flex",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.2)"}`,
                    }}>
                      <ExerciseIcon size={28} color="#8b5cf6" />
                    </div>
                  </div>
                  <strong style={{ 
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    fontSize: "1.25rem",
                    display: "block",
                    marginBottom: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}>Genera ejercicios</strong>
                  <p style={{ 
                    fontSize: "0.9375rem", 
                    marginTop: "0.5rem", 
                    opacity: 0.9,
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    lineHeight: 1.6,
                  }}>
                    Crea ejercicios prácticos adaptados a tu nivel para reforzar el aprendizaje
                  </p>
                </div>

                {/* Tarjeta 6: Explica concepto */}
                <div
                  onClick={() => {
                    setInput("Explica el concepto de ");
                    textareaRef.current?.focus();
                    scrollToBottom();
                  }}
                  style={{
                    padding: "2rem 1.5rem",
                    background: colorTheme === "dark"
                      ? "rgba(26, 26, 36, 0.6)"
                      : "rgba(255, 255, 255, 0.9)",
                    borderRadius: "16px",
                    border: `1px solid ${colorTheme === "dark" ? "rgba(6, 182, 212, 0.2)" : "rgba(6, 182, 212, 0.15)"}`,
                    boxShadow: colorTheme === "dark"
                      ? "0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(6, 182, 212, 0.1)"
                      : "0 4px 20px rgba(6, 182, 212, 0.08), 0 0 0 1px rgba(6, 182, 212, 0.1)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(6, 182, 212, 0.5)" : "rgba(6, 182, 212, 0.3)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 8px 30px rgba(6, 182, 212, 0.3), 0 0 0 1px rgba(6, 182, 212, 0.2)"
                      : "0 8px 30px rgba(6, 182, 212, 0.15), 0 0 0 1px rgba(6, 182, 212, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(6, 182, 212, 0.2)" : "rgba(6, 182, 212, 0.15)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(6, 182, 212, 0.1)"
                      : "0 4px 20px rgba(6, 182, 212, 0.08), 0 0 0 1px rgba(6, 182, 212, 0.1)";
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "linear-gradient(90deg, #06b6d4, #0891b2)",
                  }} />
                  <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      padding: "1rem",
                      background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(8, 145, 178, 0.15))",
                      borderRadius: "12px",
                      display: "inline-flex",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(6, 182, 212, 0.3)" : "rgba(6, 182, 212, 0.2)"}`,
                    }}>
                      <LightbulbIcon size={28} color="#06b6d4" />
                    </div>
                  </div>
                  <strong style={{ 
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    fontSize: "1.25rem",
                    display: "block",
                    marginBottom: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}>Explica concepto</strong>
                  <p style={{ 
                    fontSize: "0.9375rem", 
                    marginTop: "0.5rem", 
                    opacity: 0.9,
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    lineHeight: 1.6,
                  }}>
                    Obtén explicaciones detalladas y claras sobre cualquier concepto
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`message-container ${message.role === "user" ? "user-message-premium" : "assistant-message-premium"}`}
              style={{
                display: "flex",
                justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "1.5rem",
                animation: message.role === "user" 
                  ? `userMessageEnter 1.1s cubic-bezier(0.25, 0.1, 0.25, 1) ${index * 0.05}s forwards`
                  : `assistantMessageEnter 1.3s cubic-bezier(0.25, 0.1, 0.25, 1) ${index * 0.05}s forwards`,
              }}
            >
              <div
                className="message-bubble-premium"
                style={{
                  maxWidth: message.type === "notes" || message.type === "test" || message.type === "exercise" || message.type === "exercise_result" || message.type === "success" || message.type === "warning" ? "100%" : "85%",
                  width: message.type === "notes" || message.type === "test" || message.type === "exercise" || message.type === "exercise_result" || message.type === "success" || message.type === "warning" ? "100%" : undefined,
                  padding: "1.25rem 1.5rem",
                  borderRadius: "12px",
                  background:
                    message.role === "user"
                      ? "#6366f1"
                      : colorTheme === "dark"
                      ? "rgba(26, 26, 36, 0.8)"
                      : "#ffffff",
                  border:
                    message.role === "assistant"
                      ? `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)"}`
                      : "none",
                  boxShadow: message.role === "user"
                    ? "0 4px 16px rgba(99, 102, 241, 0.3), 0 2px 8px rgba(99, 102, 241, 0.2)"
                    : colorTheme === "dark"
                    ? "0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)"
                    : "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.08)",
                  color: message.role === "user" ? "white" : (colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"),
                  position: "relative",
                  overflow: "hidden",
                  willChange: "transform, opacity",
                }}
              >
                {/* Efecto de entrada único para usuario - solo una vez */}
                {message.role === "user" && (
                  <div 
                    className="user-entry-effect"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 30%, transparent 60%)",
                      animation: "userEntryShine 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                      pointerEvents: "none",
                    }}
                  />
                )}
                
                {/* Efecto de entrada único para asistente - solo una vez */}
                {message.role === "assistant" && (
                  <div 
                    className="assistant-entry-effect"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.25) 40%, rgba(139, 92, 246, 0.2) 50%, rgba(99, 102, 241, 0.25) 60%, transparent 100%)",
                      animation: "assistantEntryReveal 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                      pointerEvents: "none",
                    }}
                  />
                )}
                {message.type === "notes" ? (
                  <>
                    <NotesViewer 
                      content={message.content} 
                      colorTheme={colorTheme}
                      language={currentChatLevel?.topic || null}
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
                ) : message.type === "exercise" && currentExercise ? (
                  <>
                    <ExerciseComponent
                      exercise={currentExercise}
                      answer={exerciseAnswer}
                      answerImage={exerciseAnswerImage}
                      onAnswerChange={setExerciseAnswer}
                      onAnswerImageChange={setExerciseAnswerImage}
                      onImageRemove={() => setExerciseAnswerImage(null)}
                      imageInputRef={exerciseImageInputRef}
                      onSubmit={correctExercise}
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
                ) : message.type === "exercise_result" && exerciseCorrection ? (
                  <>
                    <ExerciseResultComponent
                      correction={exerciseCorrection}
                      exercise={currentExercise}
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
                ) : message.type === "warning" ? (
                  <div
                    style={{
                      background: colorTheme === "dark" 
                        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))"
                        : "linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.08))",
                      borderRadius: "20px",
                      padding: "2.5rem",
                      border: `2px solid ${colorTheme === "dark" ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.5)"}`,
                      boxShadow: colorTheme === "dark"
                        ? "0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                        : "0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                      width: "100%",
                    }}
                  >
                    {/* Header con icono de advertencia */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      gap: "1rem", 
                      marginBottom: "2rem" 
                    }}>
                      <div style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 4px 16px rgba(239, 68, 68, 0.4)",
                      }}>
                        <AlertIcon size={32} color="white" />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <h2 style={{
                          margin: 0,
                          fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                          fontWeight: 700,
                          color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                          marginBottom: "0.5rem",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.2,
                        }}>
                          Atención
                        </h2>
                      </div>
                    </div>

                    {/* Contenido del mensaje */}
                    <div
                      style={{
                        lineHeight: 1.8,
                        color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                        fontSize: "1.1rem",
                      }}
                      className="message-content"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ ...props }) => <h1 {...props} style={{ textDecoration: "none", borderBottom: "none", fontSize: "1.5rem", marginTop: "1rem", marginBottom: "0.5rem" }} />,
                          h2: ({ ...props }) => <h2 {...props} style={{ textDecoration: "none", borderBottom: "none", fontSize: "1.3rem", marginTop: "1rem", marginBottom: "0.5rem" }} />,
                          h3: ({ ...props }) => <h3 {...props} style={{ textDecoration: "none", borderBottom: "none", fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem" }} />,
                          strong: ({ ...props }) => <strong {...props} style={{ 
                            textDecoration: "none !important", 
                            borderBottom: "none !important",
                            fontWeight: 700,
                            color: "#ef4444",
                          }} />,
                          p: ({ ...props }) => <p {...props} style={{ margin: "1rem 0", textDecoration: "none", fontSize: "1.1rem" }} />,
                          li: ({ ...props }) => <li {...props} style={{ textDecoration: "none", marginBottom: "0.5rem", fontSize: "1.05rem" }} />,
                          ul: ({ ...props }) => <ul {...props} style={{ margin: "1rem 0", paddingLeft: "1.5rem" }} />,
                          a: ({ href, children, ...props }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.5rem 1rem",
                                background: colorTheme === "dark" ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.1)",
                                borderRadius: "8px",
                                border: `1px solid ${colorTheme === "dark" ? "rgba(96, 165, 250, 0.3)" : "rgba(37, 99, 235, 0.3)"}`,
                                color: colorTheme === "dark" ? "#60a5fa" : "#2563eb",
                                textDecoration: "none",
                                fontWeight: 500,
                                margin: "0.25rem 0",
                                transition: "all 0.2s ease",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = colorTheme === "dark" ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.2)";
                                e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(96, 165, 250, 0.5)" : "rgba(37, 99, 235, 0.5)";
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow = `0 4px 12px ${colorTheme === "dark" ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.2)"}`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = colorTheme === "dark" ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.1)";
                                e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(96, 165, 250, 0.3)" : "rgba(37, 99, 235, 0.3)";
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              <span>🔗</span>
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : message.type === "level_selection" ? (
                  // Ocultar mensajes antiguos de level_selection que contengan "Excelente elección"
                  message.content.includes("Excelente elección") || message.content.includes("darle caña") ? null : (
                  <div
                    style={{
                      lineHeight: 1.6,
                      color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                      width: "100%",
                    }}
                    className="message-content"
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ ...props }) => <h1 {...props} style={{ textDecoration: "none", borderBottom: "none" }} />,
                        h2: ({ ...props }) => <h2 {...props} style={{ textDecoration: "none", borderBottom: "none" }} />,
                        h3: ({ ...props }) => <h3 {...props} style={{ textDecoration: "none", borderBottom: "none" }} />,
                        strong: ({ ...props }) => <strong {...props} style={{ 
                          textDecoration: "none !important", 
                          borderBottom: "none !important",
                          fontWeight: 700,
                        }} />,
                        p: ({ ...props }) => <p {...props} style={{ margin: "0.5rem 0", textDecoration: "none" }} />,
                      }}
                    >
                      {message.content.split('\n\n')[0]}
                    </ReactMarkdown>
                    <div style={{
                      marginTop: "1.75rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.25rem",
                    }}>
                      <p style={{
                        margin: "0",
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                        letterSpacing: "-0.01em",
                      }}>
                        {message.content.split('\n\n').slice(1).join('\n\n').split('\n')[0]}
                      </p>
                      <div style={{
                        display: "flex",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}>
                        {[
                          { label: "Principiante", level: 0, icon: HiAcademicCap, color: "#10b981" },
                          { label: "Intermedio", level: 4, icon: HiArrowTrendingUp, color: "#f59e0b" },
                          { label: "Avanzado", level: 7, icon: HiLightBulb, color: "#6366f1" },
                        ].map(({ label, level, icon: IconComponent, color }) => {
                          const isSelected = currentChatLevel?.level === level && currentChatLevel?.topic === message.topic;
                          return (
                            <button
                              key={level}
                              onClick={async () => {
                                if (!currentChatId || !message.topic) return;
                                
                                try {
                                  // Establecer el nivel en el chat
                                  const response = await fetch("/api/study-agents/set-chat-level", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      userId,
                                      chatId: currentChatId,
                                      level,
                                      topic: message.topic,
                                    }),
                                  });
                                  
                                  const data = await response.json();
                                  if (data.success) {
                                    // Actualizar el nivel del chat
                                    setCurrentChatLevel({ topic: message.topic, level });
                                    
                                    // Agregar mensaje confirmando el nivel seleccionado
                                    addMessage({
                                      role: "user",
                                      content: label,
                                      type: "message",
                                    });
                                    
                                    // Agregar mensaje del asistente confirmando y empezando
                                    addMessage({
                                      role: "assistant",
                                      content: `Perfecto, nivel **${label}** (${level}/10) seleccionado. ¿En qué te gustaría enfocarnos primero?`,
                                      type: "message",
                                    });
                                  } else {
                                    throw new Error(data.error || "Error al establecer el nivel");
                                  }
                                } catch (error) {
                                  const errorMessage = error instanceof Error ? error.message : "Error inesperado";
                                  addMessage({
                                    role: "assistant",
                                    content: `Error al establecer el nivel: ${errorMessage}`,
                                    type: "message",
                                  });
                                }
                              }}
                              style={{
                                padding: "1rem 1.75rem",
                                borderRadius: "12px",
                                border: isSelected 
                                  ? `2px solid ${color}`
                                  : `2px solid ${colorTheme === "dark" 
                                      ? "rgba(148, 163, 184, 0.3)" 
                                      : "rgba(148, 163, 184, 0.4)"}`,
                                background: isSelected
                                  ? colorTheme === "dark"
                                    ? `${color}20`
                                    : `${color}15`
                                  : colorTheme === "dark"
                                    ? "rgba(148, 163, 184, 0.08)"
                                    : "rgba(148, 163, 184, 0.05)",
                                color: isSelected 
                                  ? color 
                                  : (colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"),
                                fontSize: "1rem",
                                fontWeight: isSelected ? 700 : 600,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                fontFamily: outfit.style.fontFamily,
                                display: "flex",
                                alignItems: "center",
                                gap: "0.625rem",
                                boxShadow: isSelected 
                                  ? `0 4px 16px ${color}30`
                                  : "none",
                                transform: isSelected ? "translateY(-2px)" : "translateY(0)",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = colorTheme === "dark"
                                    ? `${color}25`
                                    : `${color}20`;
                                  e.currentTarget.style.border = `2px solid ${color}`;
                                  e.currentTarget.style.color = color;
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = `0 4px 16px ${color}30`;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = colorTheme === "dark"
                                    ? "rgba(148, 163, 184, 0.08)"
                                    : "rgba(148, 163, 184, 0.05)";
                                  e.currentTarget.style.border = `2px solid ${colorTheme === "dark" 
                                    ? "rgba(148, 163, 184, 0.3)" 
                                    : "rgba(148, 163, 184, 0.4)"}`;
                                  e.currentTarget.style.color = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "none";
                                }
                              }}
                            >
                              <IconComponent size={20} style={{ color: isSelected ? color : "currentColor", flexShrink: 0 }} />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  )
                ) : (
                  <>
                    {message.role === "assistant" ? (
                      <div
                        style={{
                          lineHeight: 1.6,
                          color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                        }}
                        className="message-content"
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ ...props }) => <h1 {...props} style={{ textDecoration: "none", borderBottom: "none" }} />,
                            h2: ({ ...props }) => <h2 {...props} style={{ textDecoration: "none", borderBottom: "none" }} />,
                            h3: ({ ...props }) => <h3 {...props} style={{ textDecoration: "none", borderBottom: "none" }} />,
                            h4: ({ ...props }) => <h4 {...props} style={{ textDecoration: "none", borderBottom: "none" }} />,
                            h5: ({ ...props }) => <h5 {...props} style={{ textDecoration: "none", borderBottom: "none" }} />,
                            h6: ({ ...props }) => <h6 {...props} style={{ textDecoration: "none", borderBottom: "none" }} />,
                            strong: ({ ...props }) => <strong {...props} style={{ 
                              textDecoration: "none !important", 
                              borderBottom: "none !important",
                              textUnderlineOffset: "0 !important",
                              textUnderlinePosition: "unset !important",
                              fontWeight: 700,
                              background: "none !important",
                              backgroundColor: "transparent !important",
                              padding: 0,
                              borderRadius: 0,
                            }} />,
                            p: ({ ...props }) => <p {...props} style={{ margin: "0.5rem 0", textDecoration: "none" }} />,
                            li: ({ ...props }) => <li {...props} style={{ textDecoration: "none" }} />,
                            span: ({ ...props }) => <span {...props} style={{ textDecoration: "none" }} />,
                            div: ({ ...props }) => <div {...props} style={{ textDecoration: "none" }} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                      }}
                    >
                      {message.content}
                    </div>
                    )}
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

          {(isLoading || isGeneratingTest || isGeneratingExercise) && (
            <div
              className="message-container loading-message-container"
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: "1.5rem",
                animation: "loadingMessageEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                opacity: 1,
              }}
            >
              <div
                className="premium-loading-card"
                style={{
                  padding: "1.75rem 2.25rem",
                  borderRadius: "20px",
                  background: colorTheme === "dark" 
                    ? "linear-gradient(135deg, rgba(26, 26, 36, 0.98), rgba(30, 30, 45, 0.95))"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.98))",
                  border: `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.3)"}`,
                  boxShadow: colorTheme === "dark"
                    ? "0 12px 48px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 60px rgba(99, 102, 241, 0.2)"
                    : "0 12px 48px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 0 60px rgba(99, 102, 241, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "1.75rem",
                  position: "relative",
                  overflow: "hidden",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  minWidth: "360px",
                  transform: "translateZ(0)",
                  willChange: "transform, opacity",
                }}
              >
                {/* Animated Background Glow - Multiple Layers - Fixed to prevent square flashes */}
                <div 
                  className="loading-card-glow"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "200%",
                    height: "200%",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(ellipse at center, ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.25)" : "rgba(99, 102, 241, 0.18)"} 0%, ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)"} 40%, transparent 70%)`,
                    animation: "loadingGlowRotate 8s linear infinite",
                    pointerEvents: "none",
                    zIndex: 0,
                    borderRadius: "50%",
                    filter: "blur(40px)",
                  }}
                />
                <div 
                  className="loading-card-glow-secondary"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "180%",
                    height: "180%",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(ellipse at center, ${colorTheme === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.12)"} 0%, ${colorTheme === "dark" ? "rgba(139, 92, 246, 0.08)" : "rgba(139, 92, 246, 0.06)"} 45%, transparent 75%)`,
                    animation: "loadingGlowRotate 10s linear infinite reverse",
                    pointerEvents: "none",
                    zIndex: 0,
                    borderRadius: "50%",
                    filter: "blur(35px)",
                  }}
                />
                
                {/* Premium Loading Animation - Enhanced */}
                <div className="premium-loading-indicator-enhanced">
                  <div className="loading-orb-container-enhanced">
                    <div className="loading-orb-enhanced orb-1-enhanced"></div>
                    <div className="loading-orb-enhanced orb-2-enhanced"></div>
                    <div className="loading-orb-enhanced orb-3-enhanced"></div>
                    <div className="loading-orb-enhanced orb-4-enhanced"></div>
                  </div>
                  <div className="loading-pulse-ring-enhanced ring-1"></div>
                  <div className="loading-pulse-ring-enhanced ring-2"></div>
                  <div className="loading-center-core"></div>
                </div>
                
                <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
                  <div style={{ 
                    fontSize: "1.125rem", 
                    fontWeight: 700,
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}>
                    <span>
                      {isGeneratingTest 
                        ? "Generando test..." 
                        : isGeneratingExercise 
                        ? "Generando ejercicio..." 
                        : (loadingMessage || "Procesando...")}
                    </span>
                    <span className="loading-dots-enhanced">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: "0.875rem", 
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    opacity: 0.9,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}>
                    <div className="loading-progress-bar-container">
                      <div className="loading-progress-bar"></div>
                    </div>
                    <span>Esto puede tardar unos segundos</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Herramienta de flashcards para idiomas y temas generales - al final de los mensajes */}
          {/* Solo mostrar si está explícitamente activada Y (el tema es un idioma O hay solicitud explícita) */}
          {showLanguageTool && (
            (currentChatLevel && isLanguageTopic(currentChatLevel.topic)) || 
            detectContextualTools.explicitFlashcardRequest
          ) && (
            <div 
              className="component-enter"
              style={{ 
                marginBottom: "1.5rem",
                animation: "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <LanguageFlashcards
                language={detectContextualTools.detectedLanguage || currentChatLevel?.topic || (detectContextualTools.explicitFlashcardRequest ? "General" : "Idioma")}
                level={currentChatLevel?.level || 0}
                colorTheme={colorTheme}
                apiKey={apiKeys?.openai}
                userId={userId}
                setLearnedWordsCount={setLearnedWordsCount}
                currentChatLevel={currentChatLevel}
                setCurrentChatLevel={setCurrentChatLevel}
              />
            </div>
          )}

          {/* Herramienta de intérprete SQL - al final de los mensajes */}
          {showCodeTool && detectContextualTools.hasSQL && (
            <div style={{ marginBottom: "1.5rem" }}>
              <CodeInterpreter
                language="SQL"
                colorTheme={colorTheme}
              />
            </div>
          )}

          {/* Herramienta de intérprete para lenguajes de programación - al final de los mensajes */}
          {showCodeTool && !detectContextualTools.hasSQL && ((currentChatLevel && isProgrammingLanguage(currentChatLevel.topic)) || detectContextualTools.hasProgramming) && (
            <div style={{ marginBottom: "1.5rem" }}>
              <CodeInterpreter
                language={detectContextualTools.detectedProgramming || currentChatLevel?.topic || "Python"}
                colorTheme={colorTheme}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Modal de palabras aprendidas */}
        {showLearnedWordsModal && currentChatLevel && isLanguageTopic(currentChatLevel.topic) && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
              padding: "2rem",
            }}
            onClick={() => setShowLearnedWordsModal(false)}
          >
            <div
              style={{
                background: colorTheme === "dark" ? "rgba(26, 26, 36, 0.98)" : "rgba(255, 255, 255, 0.98)",
                borderRadius: "20px",
                padding: "2.5rem",
                maxWidth: "900px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
                border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.4)"}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                }}>
                  Palabras aprendidas - {currentChatLevel.topic} ({learnedWordsList.length})
                </h2>
                <button
                  onClick={() => setShowLearnedWordsModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "1.5rem",
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    cursor: "pointer",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colorTheme === "dark" 
                      ? "rgba(148, 163, 184, 0.1)" 
                      : "rgba(148, 163, 184, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  ✕
                </button>
              </div>

              {learnedWordsList.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
                  <div style={{ fontSize: "1.125rem" }}>
                    Aún no has aprendido ninguna palabra.
                    <br />
                    ¡Sigue practicando!
                  </div>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1.25rem",
                }}>
                  {learnedWordsList.map((word, index) => (
                    <div
                      key={index}
                      style={{
                        background: colorTheme === "dark" 
                          ? "rgba(16, 185, 129, 0.1)" 
                          : "rgba(16, 185, 129, 0.08)",
                        border: `2px solid ${colorTheme === "dark" 
                          ? "rgba(16, 185, 129, 0.3)" 
                          : "rgba(16, 185, 129, 0.4)"}`,
                        borderRadius: "16px",
                        padding: "1.5rem",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = colorTheme === "dark"
                          ? "0 8px 16px rgba(16, 185, 129, 0.2)"
                          : "0 8px 16px rgba(16, 185, 129, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                        marginBottom: "0.5rem",
                        textAlign: "center",
                      }}>
                        {word.word}
                      </div>
                      
                      {word.romanization && (
                        <div style={{
                          fontSize: "0.875rem",
                          color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                          fontStyle: "italic",
                          marginBottom: "0.75rem",
                          textAlign: "center",
                          opacity: 0.8,
                        }}>
                          {word.romanization}
                        </div>
                      )}

                      <div style={{
                        fontSize: "1.125rem",
                        fontWeight: 600,
                        color: "#10b981",
                        marginBottom: "0.5rem",
                        textAlign: "center",
                      }}>
                        {word.translation}
                      </div>

                      {word.example && (
                        <div style={{
                          fontSize: "0.875rem",
                          color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                          fontStyle: "italic",
                          marginTop: "0.75rem",
                          paddingTop: "0.75rem",
                          borderTop: `1px solid ${colorTheme === "dark" 
                            ? "rgba(148, 163, 184, 0.2)" 
                            : "rgba(148, 163, 184, 0.3)"}`,
                          textAlign: "center",
                        }}>
                          {word.example}
                        </div>
                      )}
                      
                      {word.source && (
                        <div style={{
                          fontSize: "0.75rem",
                          color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                          marginTop: "0.5rem",
                          textAlign: "center",
                          opacity: 0.7,
                        }}>
                          Fuente: {word.source}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botón flotante para ir al final - arriba del input */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            style={{
              position: "absolute",
              bottom: "120px",
              right: "2rem",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: colorTheme === "dark"
                ? "rgba(99, 102, 241, 0.3)"
                : "rgba(99, 102, 241, 0.25)",
              border: `1.5px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0.4)"}`,
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: colorTheme === "dark"
                ? "0 2px 8px rgba(99, 102, 241, 0.3)"
                : "0 2px 8px rgba(99, 102, 241, 0.25)",
              transition: "all 0.2s ease",
              zIndex: 200,
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = colorTheme === "dark"
                ? "0 6px 16px rgba(99, 102, 241, 0.5)"
                : "0 6px 16px rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = colorTheme === "dark"
                ? "0 4px 12px rgba(99, 102, 241, 0.4)"
                : "0 4px 12px rgba(99, 102, 241, 0.3)";
            }}
            title="Ir al final del chat"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}

        {/* Input Area */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? "0.5rem" : "0.75rem",
            padding: isMobile ? "0.75rem" : "1rem",
            background: colorTheme === "light" ? "#ffffff" : "rgba(26, 26, 36, 0.95)",
            borderRadius: isMobile ? "8px" : "12px",
            border: colorTheme === "light" 
              ? "1px solid rgba(148, 163, 184, 0.3)" 
              : "1px solid rgba(148, 163, 184, 0.2)",
            boxShadow: colorTheme === "light"
              ? "0 -4px 12px rgba(0, 0, 0, 0.1)"
              : "0 -4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 100,
            marginTop: "auto",
          }}
        >
          {/* File Upload and Settings */}
          <div style={{ display: "flex", gap: isMobile ? "0.5rem" : "0.75rem", flexWrap: "wrap", alignItems: "center", overflowX: isMobile ? "auto" : "visible" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
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
                justifyContent: "center",
                gap: isMobile ? "0.375rem" : "0.5rem",
                height: isMobile ? "40px" : "48px",
                padding: isMobile ? "0 0.75rem" : "0 1rem",
                background: (isLoading || isGeneratingTest)
                  ? (colorTheme === "light" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.2)")
                  : (colorTheme === "light" ? "#ffffff" : "#ffffff"),
                border: colorTheme === "light" && !(isLoading || isGeneratingTest)
                  ? `1px solid rgba(148, 163, 184, 0.2)`
                  : (colorTheme === "dark" ? `1px solid rgba(148, 163, 184, 0.2)` : `1px solid rgba(148, 163, 184, 0.2)`),
                borderRadius: "24px",
                cursor: (isLoading || isGeneratingTest) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: (isLoading || isGeneratingTest) ? 0.6 : 1,
                boxShadow: !(isLoading || isGeneratingTest)
                  ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                  : "none",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !isGeneratingTest) {
                  e.currentTarget.style.background = "#f8f9fa";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && !isGeneratingTest) {
                  e.currentTarget.style.background = "#ffffff";
                }
              }}
            >
              <NotesIcon 
                size={isMobile ? 18 : 20} 
                color={
                  (isLoading || isGeneratingTest)
                    ? "rgba(26, 36, 52, 0.4)"
                    : "#1a1a24"
                } 
              />
              <span style={{
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                fontWeight: 600,
                color: (isLoading || isGeneratingTest)
                  ? "rgba(26, 36, 52, 0.4)"
                  : "#1a1a24",
                whiteSpace: "nowrap",
              }}>Apuntes</span>
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
                justifyContent: "center",
                gap: isMobile ? "0.375rem" : "0.5rem",
                height: isMobile ? "40px" : "48px",
                padding: isMobile ? "0 0.75rem" : "0 1rem",
                background: (isLoading || isGeneratingTest)
                  ? (colorTheme === "light" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.2)")
                  : (colorTheme === "light" ? "#ffffff" : "#ffffff"),
                border: `1px solid rgba(148, 163, 184, 0.2)`,
                borderRadius: "24px",
                cursor: (isLoading || isGeneratingTest) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: (isLoading || isGeneratingTest) ? 0.6 : 1,
                boxShadow: !(isLoading || isGeneratingTest)
                  ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                  : "none",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !isGeneratingTest) {
                  e.currentTarget.style.background = "#f8f9fa";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && !isGeneratingTest) {
                  e.currentTarget.style.background = "#ffffff";
                }
              }}
            >
              <TestIcon 
                size={isMobile ? 18 : 20} 
                color={
                  (isLoading || isGeneratingTest)
                    ? "rgba(26, 36, 52, 0.4)"
                    : "#1a1a24"
                }
              />
              <span style={{
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                fontWeight: 600,
                color: (isLoading || isGeneratingTest)
                  ? "rgba(26, 36, 52, 0.4)"
                  : "#1a1a24",
                whiteSpace: "nowrap",
              }}>{isGeneratingTest ? "Generando test..." : "Test"}</span>
            </button>
            <button
              onClick={() => {
                setInput("");
                generateExercise("medium", null, null);
              }}
              disabled={isLoading || isGeneratingExercise || isGeneratingTest}
              title="Generar ejercicio"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? "0.375rem" : "0.5rem",
                height: isMobile ? "40px" : "48px",
                padding: isMobile ? "0 0.75rem" : "0 1rem",
                background: (isLoading || isGeneratingExercise || isGeneratingTest)
                  ? (colorTheme === "light" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.2)")
                  : (colorTheme === "light" ? "#ffffff" : "#ffffff"),
                border: `1px solid rgba(148, 163, 184, 0.2)`,
                borderRadius: "24px",
                cursor: (isLoading || isGeneratingExercise || isGeneratingTest) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: (isLoading || isGeneratingExercise || isGeneratingTest) ? 0.6 : 1,
                boxShadow: !(isLoading || isGeneratingExercise || isGeneratingTest)
                  ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                  : "none",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !isGeneratingExercise && !isGeneratingTest) {
                  e.currentTarget.style.background = "#f8f9fa";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && !isGeneratingExercise && !isGeneratingTest) {
                  e.currentTarget.style.background = "#ffffff";
                }
              }}
            >
              <ExerciseIcon 
                size={isMobile ? 18 : 20} 
                color={
                  (isLoading || isGeneratingExercise || isGeneratingTest)
                    ? "rgba(26, 36, 52, 0.4)"
                    : "#1a1a24"
                } 
              />
              <span style={{
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                fontWeight: 600,
                color: (isLoading || isGeneratingExercise || isGeneratingTest)
                  ? "rgba(26, 36, 52, 0.4)"
                  : "#1a1a24",
                whiteSpace: "nowrap",
              }}>{isGeneratingExercise ? "Generando ejercicio..." : "Ejercicio"}</span>
            </button>
            
            {/* Botón de herramienta de idioma (flashcards) - disponible SOLO si el tema es un idioma O si se solicita explícitamente */}
            {/* Eliminada la detección automática por contexto para evitar activaciones accidentales */}
            {((currentChatLevel && isLanguageTopic(currentChatLevel.topic)) || detectContextualTools.explicitFlashcardRequest) && (
            <button
                onClick={() => setShowLanguageTool(!showLanguageTool)}
                title="Flashcards de vocabulario"
              style={{
                display: "flex",
                alignItems: "center",
                  justifyContent: "center",
                gap: "0.5rem",
                  height: "48px",
                  padding: "0 1rem",
                  background: showLanguageTool
                    ? "#6366f1"
                    : (colorTheme === "light" ? "#ffffff" : "#ffffff"),
                  border: `1px solid ${showLanguageTool ? "#6366f1" : "rgba(148, 163, 184, 0.2)"}`,
                  borderRadius: "24px",
                cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: showLanguageTool ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
                  flexShrink: 0,
                }}
              >
                <BookIcon size={20} color={showLanguageTool ? "white" : "#1a1a24"} />
                <span style={{
                  fontSize: "0.875rem",
                fontWeight: 600,
                  color: showLanguageTool ? "white" : "#1a1a24",
                }}>Flashcards</span>
              </button>
            )}
            
            {/* Botón de intérprete SQL - disponible si se detecta SQL en el contexto */}
            {detectContextualTools.hasSQL && (
              <button
                onClick={() => setShowCodeTool(!showCodeTool)}
                title="Intérprete SQL"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  height: "48px",
                  padding: "0 1rem",
                  background: showCodeTool
                    ? "#10b981"
                    : (colorTheme === "light" ? "#ffffff" : "#ffffff"),
                  border: `1px solid ${showCodeTool ? "#10b981" : "rgba(148, 163, 184, 0.2)"}`,
                  borderRadius: "24px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: showCodeTool ? "0 2px 8px rgba(16, 185, 129, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
                  flexShrink: 0,
                }}
              >
                <HiCircleStack size={20} color={showCodeTool ? "white" : "#1a1a24"} />
                <span style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: showCodeTool ? "white" : "#1a1a24",
                }}>SQL</span>
              </button>
            )}
            
            {/* Botón de intérprete de código - disponible si se detecta programación en el contexto */}
            {((currentChatLevel && isProgrammingLanguage(currentChatLevel.topic)) || detectContextualTools.hasProgramming) && !detectContextualTools.hasSQL && (
              <button
                onClick={() => setShowCodeTool(!showCodeTool)}
                title="Intérprete de código"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  height: "48px",
                  padding: "0 1rem",
                  background: showCodeTool
                    ? "#10b981"
                    : (colorTheme === "light" ? "#ffffff" : "#ffffff"),
                  border: `1px solid ${showCodeTool ? "#10b981" : "rgba(148, 163, 184, 0.2)"}`,
                  borderRadius: "24px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: showCodeTool ? "0 2px 8px rgba(16, 185, 129, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
                  flexShrink: 0,
                }}
              >
                <HiCodeBracket size={20} color={showCodeTool ? "white" : "#1a1a24"} />
                <span style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: showCodeTool ? "white" : "#1a1a24",
                }}>Código</span>
              </button>
            )}

            {/* Indicador de nivel de la conversación actual */}
            {currentChatLevel && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "0.5rem" : "0.75rem",
                marginLeft: isMobile ? "0" : "auto",
                flexShrink: 0,
                flexWrap: isMobile ? "wrap" : "nowrap",
              }}>
                {/* Contador de palabras aprendidas (solo para idiomas) - a la izquierda del nivel */}
                {isLanguageTopic(currentChatLevel.topic) && (
                  <button
                    onClick={async () => {
                      await loadLearnedWords(currentChatLevel.topic);
                      setShowLearnedWordsModal(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: isMobile ? "36px" : "48px",
                      padding: isMobile ? "0 0.75rem" : "0 1rem",
                      background: colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
                      borderRadius: "24px",
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                      fontWeight: 600,
                      color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                      e.currentTarget.style.background = colorTheme === "dark" 
                        ? "rgba(99, 102, 241, 0.15)" 
                        : "rgba(99, 102, 241, 0.12)";
              }}
              onMouseLeave={(e) => {
                      e.currentTarget.style.background = colorTheme === "dark" 
                        ? "rgba(99, 102, 241, 0.1)" 
                        : "rgba(99, 102, 241, 0.08)";
                    }}
                  >
                    <MdMenuBook size={18} style={{ marginRight: "0.5rem" }} />
                    <span>{learnedWordsCount} palabras</span>
                  </button>
                )}
                
                <div 
                  ref={levelDropdownRef}
                  style={{
                    position: "relative",
                  }}
                >
                  <button
                    onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "0.5rem" : "0.75rem",
                      height: isMobile ? "36px" : "48px",
                      padding: isMobile ? "0 0.75rem" : "0 1rem",
                      background: colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
                      borderRadius: "24px",
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                      fontWeight: 600,
                      color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colorTheme === "dark" 
                        ? "rgba(99, 102, 241, 0.15)" 
                        : "rgba(99, 102, 241, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colorTheme === "dark" 
                        ? "rgba(99, 102, 241, 0.1)" 
                        : "rgba(99, 102, 241, 0.08)";
                    }}
                  >
                    <span>Nivel {currentChatLevel.level}/10</span>
                    <span style={{
                      fontSize: "0.75rem",
                      transform: showLevelDropdown ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}>
                      ▲
                    </span>
                  </button>
                  
                  {showLevelDropdown && (
                    <div style={{
                      position: "absolute",
                      bottom: "calc(100% + 0.5rem)",
                      right: 0,
                      background: colorTheme === "dark" 
                        ? "rgba(26, 26, 36, 0.95)" 
                        : "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      borderRadius: "12px",
                      padding: "1rem",
                      minWidth: "240px",
                      width: "240px",
                      boxShadow: colorTheme === "dark"
                        ? "0 8px 32px rgba(0, 0, 0, 0.4)"
                        : "0 8px 32px rgba(0, 0, 0, 0.15)",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(148, 163, 184, 0.2)"}`,
                      zIndex: 1000,
                    }}>
                      {/* Slider principal */}
                      <div style={{
                        position: "relative",
                        marginBottom: "0.75rem",
                      }}>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={currentChatLevel.level}
                          onChange={async (e) => {
                            const newLevel = parseInt(e.target.value);
                            if (newLevel !== currentChatLevel.level && currentChatId && userId) {
                              try {
                                const requestBody = {
                                  userId,
                                  chatId: currentChatId,
                                  level: newLevel,
                                  topic: currentChatLevel.topic,
                                };
                                
                                console.log("📊 [Frontend] Enviando set-chat-level desde slider:", requestBody);
                                
                                const response = await fetch("/api/study-agents/set-chat-level", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(requestBody),
                                });
                                
                                if (!response.ok) {
                                  const errorText = await response.text();
                                  console.error("📊 [Frontend] Error en respuesta del slider:", response.status, errorText);
                                  throw new Error(`Error ${response.status}: ${errorText}`);
                                }
                                
                                const data = await response.json();
                                if (data.success) {
                                  setCurrentChatLevel({ topic: currentChatLevel.topic, level: newLevel });
                } else {
                                  console.error("📊 [Frontend] Error en data del slider:", data);
                                }
                              } catch (err) {
                                console.error("📊 [Frontend] Error actualizando nivel desde slider:", err);
                              }
                            }
                          }}
                          style={{
                            width: "100%",
                            height: "8px",
                            borderRadius: "4px",
                            background: "transparent",
                            outline: "none",
                            cursor: "pointer",
                            WebkitAppearance: "none",
                            appearance: "none",
                            margin: "0",
                            padding: "0",
                          }}
                          onMouseUp={() => {
                            setTimeout(() => setShowLevelDropdown(false), 200);
                          }}
                        />
                        <style>{`
                          input[type="range"]::-webkit-slider-runnable-track {
                            width: 100%;
                            height: 8px;
                            background: ${colorTheme === "dark" 
                              ? "rgba(99, 102, 241, 0.2)" 
                              : "rgba(99, 102, 241, 0.15)"};
                            border-radius: 4px;
                          }
                          input[type="range"]::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 20px;
                            height: 20px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                            cursor: pointer;
                            box-shadow: ${colorTheme === "dark" 
                              ? "0 2px 8px rgba(99, 102, 241, 0.4)" 
                              : "0 2px 8px rgba(99, 102, 241, 0.3)"};
                            border: 2px solid ${colorTheme === "dark" ? "#1a1a24" : "#ffffff"};
                            transition: all 0.2s ease;
                            margin-top: -6px;
                          }
                          input[type="range"]::-webkit-slider-thumb:hover {
                            transform: scale(1.1);
                            box-shadow: ${colorTheme === "dark" 
                              ? "0 4px 12px rgba(99, 102, 241, 0.5)" 
                              : "0 4px 12px rgba(99, 102, 241, 0.4)"};
                          }
                          input[type="range"]::-moz-range-track {
                            width: 100%;
                            height: 8px;
                            background: ${colorTheme === "dark" 
                              ? "rgba(99, 102, 241, 0.2)" 
                              : "rgba(99, 102, 241, 0.15)"};
                            border-radius: 4px;
                            border: none;
                          }
                          input[type="range"]::-moz-range-thumb {
                            width: 20px;
                            height: 20px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                            cursor: pointer;
                            box-shadow: ${colorTheme === "dark" 
                              ? "0 2px 8px rgba(99, 102, 241, 0.4)" 
                              : "0 2px 8px rgba(99, 102, 241, 0.3)"};
                            border: 2px solid ${colorTheme === "dark" ? "#1a1a24" : "#ffffff"};
                            transition: all 0.2s ease;
                          }
                          input[type="range"]::-moz-range-thumb:hover {
                            transform: scale(1.1);
                            box-shadow: ${colorTheme === "dark" 
                              ? "0 4px 12px rgba(99, 102, 241, 0.5)" 
                              : "0 4px 12px rgba(99, 102, 241, 0.4)"};
                          }
                          input[type="range"]::-ms-track {
                            width: 100%;
                            height: 8px;
                            background: transparent;
                            border-color: transparent;
                            color: transparent;
                          }
                          input[type="range"]::-ms-thumb {
                            width: 20px;
                            height: 20px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                            cursor: pointer;
                            border: 2px solid ${colorTheme === "dark" ? "#1a1a24" : "#ffffff"};
                          }
                        `}</style>
                      </div>
                      
                      {/* Input numérico y valor */}
              <div style={{
                display: "flex",
                alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                      }}>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={currentChatLevel.level}
                          onChange={async (e) => {
                            const newLevel = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                            if (newLevel !== currentChatLevel.level && currentChatId && userId) {
                              try {
                                const requestBody = {
                                  userId,
                                  chatId: currentChatId,
                                  level: newLevel,
                                  topic: currentChatLevel.topic,
                                };
                                
                                console.log("📊 [Frontend] Enviando set-chat-level:", requestBody);
                                
                                const response = await fetch("/api/study-agents/set-chat-level", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(requestBody),
                                });
                                
                                if (!response.ok) {
                                  const errorText = await response.text();
                                  console.error("📊 [Frontend] Error en respuesta:", response.status, errorText);
                                  throw new Error(`Error ${response.status}: ${errorText}`);
                                }
                                
                                const data = await response.json();
                                if (data.success) {
                                  setCurrentChatLevel({ topic: currentChatLevel.topic, level: newLevel });
                                } else {
                                  console.error("📊 [Frontend] Error en data:", data);
                                }
                              } catch (err) {
                                console.error("📊 [Frontend] Error actualizando nivel:", err);
                              }
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: "0.5rem 0.75rem",
                            background: colorTheme === "dark" 
                              ? "rgba(99, 102, 241, 0.1)" 
                              : "rgba(99, 102, 241, 0.08)",
                            border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.25)"}`,
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: colorTheme === "dark" ? "#e2e8f0" : "#1a1a24",
                            textAlign: "center",
                            cursor: "text",
                            outline: "none",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.border = colorTheme === "dark" 
                              ? "1px solid rgba(99, 102, 241, 0.5)" 
                              : "1px solid rgba(99, 102, 241, 0.4)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.border = colorTheme === "dark" 
                              ? "1px solid rgba(99, 102, 241, 0.3)" 
                              : "1px solid rgba(99, 102, 241, 0.25)";
                          }}
                        />
                        <div style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: colorTheme === "dark" ? "#94a3b8" : "#64748b",
                          whiteSpace: "nowrap",
                        }}>
                          / 10
              </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {uploadedFiles.length > 0 && (
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginLeft: currentChatLevel ? "0.75rem" : "auto" }}>
                {uploadedFiles.length} archivo(s) subido(s)
              </div>
            )}
          </div>

          {/* Text Input - Premium Design */}
          <div style={{ 
            display: "flex", 
            gap: isMobile ? "0.5rem" : "0.75rem", 
            alignItems: "stretch",
            position: "relative",
            zIndex: 10,
          }}>
            {/* Botón Subir PDF - Premium */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Subir PDF"
              style={{
                width: "48px",
                height: "48px",
                minWidth: "48px",
                padding: 0,
                background:
                  isLoading
                    ? (colorTheme === "light" ? "rgba(148, 163, 184, 0.2)" : "rgba(99, 102, 241, 0.3)")
                    : (colorTheme === "light" 
                        ? "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" 
                        : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"),
                border: colorTheme === "light" && !isLoading
                  ? `1px solid rgba(148, 163, 184, 0.25)`
                  : "none",
                borderRadius: "50%",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isLoading ? 0.6 : 1,
                boxShadow: isLoading
                  ? "none"
                  : (colorTheme === "light"
                      ? "0 4px 12px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                      : "0 4px 16px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"),
                flexShrink: 0,
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = colorTheme === "light"
                    ? "0 6px 20px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9)"
                    : "0 6px 24px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = isLoading
                    ? "none"
                    : (colorTheme === "light"
                        ? "0 4px 12px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                        : "0 4px 16px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)");
                }
              }}
            >
              <UploadIcon 
                size={isMobile ? 18 : 20} 
                color={
                  isLoading
                    ? (colorTheme === "light" ? "rgba(26, 36, 52, 0.4)" : "rgba(255, 255, 255, 0.5)")
                    : (colorTheme === "light" ? "#1a1a24" : "white")
                } 
              />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Ajustar altura automáticamente
                if (textareaRef.current) {
                  textareaRef.current.style.height = "48px";
                  const scrollHeight = textareaRef.current.scrollHeight;
                  if (scrollHeight > 48) {
                    textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
                  }
                }
              }}
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
                padding: isMobile ? "0.5rem 0.75rem" : "0.5rem 1rem",
                background: colorTheme === "dark" 
                  ? "linear-gradient(135deg, rgba(26, 26, 36, 0.9), rgba(30, 30, 45, 0.8))" 
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95))",
                border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.25)" : "rgba(148, 163, 184, 0.3)"}`,
                borderRadius: "24px",
                color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                fontSize: isMobile ? "0.875rem" : "1rem",
                resize: "none",
                minHeight: isMobile ? "40px" : "48px",
                height: isMobile ? "40px" : "48px",
                maxHeight: "150px",
                fontFamily: "inherit",
                boxShadow: colorTheme === "dark"
                  ? "0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                  : "0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                lineHeight: "1.5",
                overflowY: "auto",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              className="custom-textarea"
            />
            {/* Botón de Micrófono */}
                <button
              onClick={handleVoiceInput}
              disabled={isLoading || isGeneratingTest || isGeneratingExercise}
              title={isListening ? "Detener grabación" : "Hablar (mantén presionado)"}
                  style={{
                width: isMobile ? "40px" : "48px",
                height: isMobile ? "40px" : "48px",
                minWidth: isMobile ? "40px" : "48px",
                padding: 0,
                background: isListening
                  ? (colorTheme === "light" ? "#ef4444" : "#dc2626")
                  : (colorTheme === "light" ? "#ffffff" : "rgba(99, 102, 241, 0.2)"),
                border: colorTheme === "light" && !isListening
                  ? `1px solid rgba(148, 163, 184, 0.2)`
                  : "none",
                borderRadius: "50%",
                    cursor: (isLoading || isGeneratingTest) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                opacity: (isLoading || isGeneratingTest) ? 0.6 : 1,
                boxShadow: colorTheme === "light" && !isListening
                  ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                  : isListening
                  ? "0 0 0 4px rgba(239, 68, 68, 0.2)"
                  : "none",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                if (!isLoading && !isGeneratingTest && !isListening) {
                  if (colorTheme === "light") {
                    e.currentTarget.style.background = "#f8f9fa";
                  } else {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.3)";
                  }
                    }
                  }}
                  onMouseLeave={(e) => {
                if (!isLoading && !isGeneratingTest && !isListening) {
                  if (colorTheme === "light") {
                    e.currentTarget.style.background = "#ffffff";
                  } else {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
                  }
                    }
                  }}
                >
              <FaMicrophone 
                size={isMobile ? 18 : 20} 
                color={
                  isListening
                    ? "white"
                    : (isLoading || isGeneratingTest)
                    ? (colorTheme === "light" ? "rgba(26, 36, 52, 0.4)" : "rgba(255, 255, 255, 0.5)")
                    : (colorTheme === "light" ? "#1a1a24" : "white")
                } 
              />
                </button>
              {/* Botón Enviar - Premium */}
              <button
                onClick={handleSend}
                disabled={isLoading || isGeneratingTest || isGeneratingExercise || !input.trim()}
                title="Enviar mensaje"
                style={{
                width: isMobile ? "40px" : "48px",
                height: isMobile ? "40px" : "48px",
                minWidth: isMobile ? "40px" : "48px",
                padding: 0,
                  background:
                    (isLoading || isGeneratingTest || !input.trim())
                    ? (colorTheme === "light" ? "rgba(148, 163, 184, 0.2)" : "rgba(99, 102, 241, 0.3)")
                    : (colorTheme === "light" 
                        ? "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" 
                        : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"),
                border: colorTheme === "light" && (input.trim() && !isLoading && !isGeneratingTest)
                  ? `1px solid rgba(148, 163, 184, 0.25)`
                  : "none",
                borderRadius: "50%",
                  cursor: (isLoading || isGeneratingTest || !input.trim()) ? "not-allowed" : "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: (isLoading || isGeneratingTest || !input.trim()) ? 0.6 : 1,
                boxShadow: (isLoading || isGeneratingTest || !input.trim())
                  ? "none"
                  : (colorTheme === "light"
                      ? "0 4px 12px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                      : "0 4px 16px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"),
                flexShrink: 0,
                position: "relative",
                overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && !isGeneratingTest && input.trim()) {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = colorTheme === "light"
                      ? "0 6px 20px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9)"
                      : "0 6px 24px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                if (!isLoading && !isGeneratingTest && input.trim()) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = (isLoading || isGeneratingTest || !input.trim())
                    ? "none"
                    : (colorTheme === "light"
                        ? "0 4px 12px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                        : "0 4px 16px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)");
                }
                }}
              >
              <SendIcon 
                size={isMobile ? 18 : 20} 
                color={
                  (isLoading || isGeneratingTest || !input.trim())
                    ? (colorTheme === "light" ? "rgba(26, 36, 52, 0.4)" : "rgba(255, 255, 255, 0.5)")
                    : (colorTheme === "light" ? "#1a1a24" : "white")
                } 
              />
              </button>
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
        /* Estilos para eliminar subrayados en mensajes normales del asistente - MÁXIMA PRIORIDAD */
        :global(.message-content),
        :global(.message-content *),
        :global(.message-content h1),
        :global(.message-content h2),
        :global(.message-content h3),
        :global(.message-content h4),
        :global(.message-content h5),
        :global(.message-content h6),
        :global(.message-content h1 *),
        :global(.message-content h2 *),
        :global(.message-content h3 *),
        :global(.message-content h4 *),
        :global(.message-content h5 *),
        :global(.message-content h6 *),
        :global(.message-content strong),
        :global(.message-content strong *),
        :global(.message-content p),
        :global(.message-content p *),
        :global(.message-content li),
        :global(.message-content li *),
        :global(.message-content div),
        :global(.message-content div *),
        :global(.message-content span),
        :global(.message-content span *),
        :global(.message-content p strong),
        :global(.message-content li strong),
        :global(.message-content div strong),
        :global(.message-content span strong),
        :global(.message-content a) {
          text-decoration: none !important;
          border-bottom: none !important;
          text-underline-offset: 0 !important;
          text-underline-position: unset !important;
        }
        :global(.message-content h1),
        :global(.message-content h2),
        :global(.message-content h3),
        :global(.message-content h4),
        :global(.message-content h5),
        :global(.message-content h6) {
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        :global(.message-content strong),
        :global(.message-content strong *),
        :global(.message-content p strong),
        :global(.message-content li strong),
        :global(.message-content div strong),
        :global(.message-content span strong),
        :global(.message-content h1 strong),
        :global(.message-content h2 strong),
        :global(.message-content h3 strong),
        :global(.message-content h4 strong),
        :global(.message-content h5 strong),
        :global(.message-content h6 strong) {
          font-weight: 700 !important;
          text-decoration: none !important;
          border-bottom: none !important;
          text-underline-offset: 0 !important;
          text-underline-position: unset !important;
          box-shadow: none !important;
          outline: none !important;
          background: none !important;
          background-color: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        /* Estilos personalizados para el scrollbar del textarea */
        :global(.custom-textarea::-webkit-scrollbar) {
          width: 6px;
        }
        :global(.custom-textarea::-webkit-scrollbar-track) {
          background: transparent;
          border-radius: 10px;
        }
        :global(.custom-textarea::-webkit-scrollbar-thumb) {
          background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.4)"};
          border-radius: 10px;
        }
        :global(.custom-textarea::-webkit-scrollbar-thumb:hover) {
          background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.5)" : "rgba(148, 163, 184, 0.6)"};
        }
        /* Para Firefox */
        :global(.custom-textarea) {
          scrollbar-width: thin;
          scrollbar-color: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.4)"} transparent;
        }
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
        /* ===== ANIMACIONES PREMIUM ULTRA FLUIDAS ===== */
        
        /* Entrada del mensaje del usuario - Ultra fluida con múltiples etapas */
        @keyframes userMessageEnter {
          0% {
            opacity: 0;
            transform: translateX(150px) scale(0.85) perspective(1200px) rotateY(-15deg) translateZ(-50px);
            filter: blur(12px);
          }
          8% {
            opacity: 0.15;
            transform: translateX(100px) scale(0.88) perspective(1200px) rotateY(-10deg) translateZ(-30px);
            filter: blur(9px);
          }
          18% {
            opacity: 0.35;
            transform: translateX(60px) scale(0.91) perspective(1200px) rotateY(-6deg) translateZ(-15px);
            filter: blur(6px);
          }
          30% {
            opacity: 0.55;
            transform: translateX(25px) scale(0.94) perspective(1200px) rotateY(-3deg) translateZ(-5px);
            filter: blur(4px);
          }
          45% {
            opacity: 0.75;
            transform: translateX(-5px) scale(0.98) perspective(1200px) rotateY(1.5deg) translateZ(5px);
            filter: blur(2px);
          }
          60% {
            opacity: 0.88;
            transform: translateX(2px) scale(1.01) perspective(1200px) rotateY(-0.8deg) translateZ(8px);
            filter: blur(0.8px);
          }
          75% {
            opacity: 0.95;
            transform: translateX(-1px) scale(0.995) perspective(1200px) rotateY(0.4deg) translateZ(5px);
            filter: blur(0.3px);
          }
          88% {
            opacity: 0.98;
            transform: translateX(0.5px) scale(1.002) perspective(1200px) rotateY(-0.2deg) translateZ(2px);
            filter: blur(0.1px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1) perspective(1200px) rotateY(0deg) translateZ(0);
            filter: blur(0);
          }
        }
        
        /* Efecto de brillo premium para usuario */
        @keyframes userEntryShine {
          0% {
            transform: translateX(-120%) translateY(-50%) rotate(25deg) scaleY(2);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(220%) translateY(-50%) rotate(25deg) scaleY(2);
            opacity: 0;
          }
        }
        
        /* Entrada del mensaje del asistente - Ultra fluida con profundidad */
        @keyframes assistantMessageEnter {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.88) perspective(1200px) rotateX(12deg) translateZ(-40px);
            filter: blur(14px) brightness(0.6) contrast(0.8);
          }
          10% {
            opacity: 0.2;
            transform: translateY(45px) scale(0.90) perspective(1200px) rotateX(8deg) translateZ(-25px);
            filter: blur(10px) brightness(0.7) contrast(0.85);
          }
          22% {
            opacity: 0.4;
            transform: translateY(32px) scale(0.92) perspective(1200px) rotateX(5deg) translateZ(-12px);
            filter: blur(7px) brightness(0.8) contrast(0.9);
          }
          35% {
            opacity: 0.6;
            transform: translateY(20px) scale(0.94) perspective(1200px) rotateX(3deg) translateZ(-4px);
            filter: blur(5px) brightness(0.88) contrast(0.95);
          }
          50% {
            opacity: 0.78;
            transform: translateY(10px) scale(0.96) perspective(1200px) rotateX(1.5deg) translateZ(3px);
            filter: blur(3px) brightness(0.94) contrast(0.98);
          }
          65% {
            opacity: 0.88;
            transform: translateY(4px) scale(0.98) perspective(1200px) rotateX(0.5deg) translateZ(6px);
            filter: blur(1.5px) brightness(0.97) contrast(1);
          }
          80% {
            opacity: 0.95;
            transform: translateY(1px) scale(0.99) perspective(1200px) rotateX(-0.3deg) translateZ(4px);
            filter: blur(0.6px) brightness(0.99) contrast(1.02);
          }
          92% {
            opacity: 0.98;
            transform: translateY(0.3px) scale(1.005) perspective(1200px) rotateX(0.1deg) translateZ(1px);
            filter: blur(0.2px) brightness(1) contrast(1.01);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) perspective(1200px) rotateX(0deg) translateZ(0);
            filter: blur(0) brightness(1) contrast(1);
          }
        }
        
        /* Efecto de revelado premium para asistente */
        @keyframes assistantEntryReveal {
          0% {
            transform: translateX(-110%) scaleX(0.3) scaleY(1.2);
            opacity: 0;
          }
          15% {
            opacity: 0.5;
          }
          35% {
            opacity: 0.85;
          }
          55% {
            opacity: 0.95;
          }
          75% {
            opacity: 0.7;
          }
          100% {
            transform: translateX(210%) scaleX(1) scaleY(1);
            opacity: 0;
          }
        }
        
        /* Estilos base para los contenedores - Optimizados para 60fps */
        .user-message-premium,
        .assistant-message-premium {
          animation-fill-mode: forwards !important;
          transform-style: preserve-3d;
          will-change: transform, opacity, filter;
        }
        
        .message-bubble-premium {
          position: relative;
          backface-visibility: hidden;
          transform-style: preserve-3d;
          will-change: transform, opacity, filter;
          transform: translateZ(0);
        }
        
        @keyframes flashcardSuccess {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes flashcardError {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-4px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(4px);
          }
        }
        
        @keyframes flashcard-flip {
          0% {
            transform: rotateY(0deg) scale(1);
            opacity: 1;
          }
          50% {
            transform: rotateY(90deg) scale(0.95);
            opacity: 0.8;
          }
          100% {
            transform: rotateY(0deg) scale(1);
            opacity: 1;
          }
        }
        
        .flashcard-flip {
          animation: flashcard-flip 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          transform-style: preserve-3d;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.98);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .message-container {
          animation-fill-mode: forwards !important;
        }
        
        .user-message,
        .assistant-message {
          animation-fill-mode: forwards !important;
        }
        
        /* Premium Chat Background Animations */
        @keyframes floatOrbChat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -60px) scale(1.1); }
          50% { transform: translate(-30px, 50px) scale(0.9); }
          75% { transform: translate(60px, 30px) scale(1.05); }
        }
        @keyframes floatOrbChat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, -80px) scale(1.15); }
          66% { transform: translate(40px, 70px) scale(0.85); }
        }
        @keyframes pulseBgChat {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.03); }
        }
        @keyframes riseLineChat {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(calc(-100vh - 200px));
            opacity: 0;
          }
        }
        @keyframes floatOrbMain1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -40px) scale(1.1); }
          50% { transform: translate(-20px, 35px) scale(0.9); }
          75% { transform: translate(45px, 25px) scale(1.05); }
        }
        @keyframes floatOrbMain2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-35px, -55px) scale(1.15); }
          66% { transform: translate(30px, 50px) scale(0.85); }
        }
        @keyframes floatOrbMain3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); }
        }
        
        /* ===== ANIMACIONES PREMIUM DE CARGA ULTRA MEJORADAS ===== */
        
        /* Entrada del mensaje de carga */
        @keyframes loadingMessageEnter {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        
        /* Glow rotativo del fondo - Suave y circular */
        @keyframes loadingGlowRotate {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) rotate(180deg) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) scale(1);
            opacity: 0.8;
          }
        }
        
        /* Estilos del scrollbar del contenedor de mensajes */
        .messages-container-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .messages-container-scroll::-webkit-scrollbar-track {
          background: ${colorTheme === "dark" ? "rgba(26, 26, 36, 0.2)" : "rgba(248, 250, 252, 0.4)"};
          border-radius: 10px;
          margin: 4px 0;
        }
        .messages-container-scroll::-webkit-scrollbar-thumb {
          background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.5)"};
          border-radius: 10px;
          border: 2px solid ${colorTheme === "dark" ? "rgba(26, 26, 36, 0.2)" : "rgba(248, 250, 252, 0.4)"};
          transition: background 0.2s ease;
        }
        .messages-container-scroll::-webkit-scrollbar-thumb:hover {
          background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.6)" : "rgba(148, 163, 184, 0.7)"};
        }
        
        /* Contenedor principal del indicador de carga premium mejorado */
        .premium-loading-indicator-enhanced {
          position: relative;
          width: 90px;
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          z-index: 1;
        }
        
        /* Contenedor de orbes flotantes mejorado */
        .loading-orb-container-enhanced {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        /* Orbes minimalistas y fluidos */
        .loading-orb-enhanced {
          position: absolute;
          border-radius: 50%;
          animation: loadingOrbRotateEnhanced 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
        
        .loading-orb-enhanced.orb-1-enhanced {
          width: 12px;
          height: 12px;
          background: #6366f1;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0s;
          opacity: 0.9;
        }
        
        .loading-orb-enhanced.orb-2-enhanced {
          width: 10px;
          height: 10px;
          background: #8b5cf6;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0.2s;
          opacity: 0.8;
        }
        
        .loading-orb-enhanced.orb-3-enhanced {
          width: 8px;
          height: 8px;
          background: #a855f7;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0.4s;
          opacity: 0.7;
        }
        
        .loading-orb-enhanced.orb-4-enhanced {
          width: 6px;
          height: 6px;
          background: #6366f1;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0.6s;
          opacity: 0.6;
        }
        
        /* Núcleo central minimalista */
        .loading-center-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          background: #6366f1;
          border-radius: 50%;
          animation: loadingCorePulse 2s ease-in-out infinite;
          z-index: 2;
        }
        
        /* Anillos de pulso minimalistas */
        .loading-pulse-ring-enhanced {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          pointer-events: none;
        }
        
        .loading-pulse-ring-enhanced.ring-1 {
          width: 70px;
          height: 70px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          animation: loadingPulseRingEnhanced 2s ease-out infinite;
        }
        
        .loading-pulse-ring-enhanced.ring-2 {
          width: 70px;
          height: 70px;
          border: 1px solid rgba(139, 92, 246, 0.25);
          animation: loadingPulseRingEnhanced 2s ease-out infinite 0.5s;
        }
        
        /* Animación minimalista y fluida */
        @keyframes loadingOrbRotateEnhanced {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(32px) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translate(-50%, -50%) rotate(180deg) translateX(32px) rotate(-180deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) translateX(32px) rotate(-360deg);
            opacity: 0.4;
          }
        }
        
        /* Animación del núcleo central minimalista */
        @keyframes loadingCorePulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 1;
          }
        }
        
        /* Animación del anillo de pulso minimalista */
        @keyframes loadingPulseRingEnhanced {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.4);
            opacity: 0;
          }
        }
        
        /* Puntos de carga animados mejorados */
        .loading-dots-enhanced {
          display: inline-flex;
          gap: 3px;
          align-items: center;
        }
        
        .loading-dots-enhanced span {
          display: inline-block;
          font-size: 1.5rem;
          line-height: 1;
          animation: loadingDotPulseEnhanced 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          font-weight: 700;
        }
        
        .loading-dots-enhanced span:nth-child(1) {
          animation-delay: 0s;
        }
        
        .loading-dots-enhanced span:nth-child(2) {
          animation-delay: 0.3s;
        }
        
        .loading-dots-enhanced span:nth-child(3) {
          animation-delay: 0.6s;
        }
        
        @keyframes loadingDotPulseEnhanced {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.8) translateY(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.3) translateY(-4px);
          }
        }
        
        /* Barra de progreso animada */
        .loading-progress-bar-container {
          width: 120px;
          height: 3px;
          background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)"};
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }
        
        .loading-progress-bar {
          height: 100%;
          width: 40%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7, #8b5cf6, #6366f1);
          background-size: 200% 100%;
          border-radius: 3px;
          animation: loadingProgressBar 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }
        
        @keyframes loadingProgressBar {
          0% {
            transform: translateX(-100%);
            background-position: 0% 0%;
          }
          50% {
            transform: translateX(200%);
            background-position: 100% 0%;
          }
          100% {
            transform: translateX(500%);
            background-position: 200% 0%;
          }
        }
        
        /* Mantener compatibilidad con la versión anterior */
        .premium-loading-indicator {
          position: relative;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .loading-orb-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .loading-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(8px);
          animation: loadingOrbRotate 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        
        .loading-orb.orb-1 {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0s;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
        }
        
        .loading-orb.orb-2 {
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0.3s;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
        }
        
        .loading-orb.orb-3 {
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #a855f7, #6366f1);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0.6s;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
        }
        
        .loading-pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 64px;
          height: 64px;
          border: 3px solid rgba(99, 102, 241, 0.3);
          border-radius: 50%;
          animation: loadingPulseRing 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        
        @keyframes loadingOrbRotate {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(24px) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) rotate(180deg) translateX(24px) rotate(-180deg) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) translateX(24px) rotate(-360deg) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes loadingPulseRing {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
            border-color: rgba(99, 102, 241, 0.5);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.6;
            border-color: rgba(139, 92, 246, 0.3);
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
            border-color: rgba(168, 85, 247, 0.1);
          }
        }
        
        .loading-dots {
          display: inline-flex;
          gap: 2px;
        }
        
        .loading-dots span {
          display: inline-block;
          animation: loadingDotPulse 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        
        .loading-dots span:nth-child(1) {
          animation-delay: 0s;
        }
        
        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes loadingDotPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        /* Skeleton loader premium */
        .premium-skeleton-loader {
          background: ${colorTheme === "dark" 
            ? "linear-gradient(90deg, rgba(26, 26, 36, 0.6) 0%, rgba(30, 30, 45, 0.8) 50%, rgba(26, 26, 36, 0.6) 100%)"
            : "linear-gradient(90deg, rgba(248, 250, 252, 0.6) 0%, rgba(255, 255, 255, 0.9) 50%, rgba(248, 250, 252, 0.6) 100%)"};
          background-size: 200% 100%;
          animation: skeletonShimmer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          border: ${colorTheme === "dark" 
            ? "1px solid rgba(148, 163, 184, 0.1)" 
            : "1px solid rgba(148, 163, 184, 0.15)"};
          position: relative;
          overflow: hidden;
        }
        
        .premium-skeleton-loader::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            ${colorTheme === "dark" 
              ? "rgba(99, 102, 241, 0.2)" 
              : "rgba(99, 102, 241, 0.15)"},
            transparent
          );
          animation: skeletonShine 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        
        @keyframes skeletonShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        @keyframes skeletonShine {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
    </>
  );
}

// Función eliminada: cleanMermaidCode - ya no se usa Mermaid

// Componente rediseñado para renderizar apuntes con estilo similar a flashcards
function NotesViewer({ 
  content, 
  colorTheme,
  language
}: { 
  content: string;
  colorTheme: "dark" | "light";
  language?: string | null;
}) {
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
  const bgColor = colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "#ffffff";
  const borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";
  
  // Función helper para detectar si es un idioma
  const isLanguageTopic = (topic: string | null | undefined): boolean => {
    if (!topic) return false;
    const topicLower = topic.toLowerCase();
    return topicLower.includes("inglés") || topicLower.includes("english") ||
      topicLower.includes("francés") || topicLower.includes("francais") ||
      topicLower.includes("alemán") || topicLower.includes("deutsch") ||
      topicLower.includes("italiano") || topicLower.includes("portugués") ||
      topicLower.includes("chino") || topicLower.includes("mandarín") || topicLower.includes("simplificado") ||
      topicLower.includes("japonés") || topicLower.includes("japones") ||
      topicLower.includes("coreano") || topicLower.includes("catalán") ||
      topicLower.includes("catalan") || topicLower.includes("ruso");
  };
  
  const isLanguage = isLanguageTopic(language);
  
  // Función helper para detectar si un texto es del idioma objetivo (no una traducción)
  const isTargetLanguageText = (text: string, targetLanguage: string | null | undefined): boolean => {
    if (!targetLanguage || !text || text.trim().length === 0) return false;
    
    const textLower = text.toLowerCase().trim();
    const langLower = targetLanguage.toLowerCase();
    
    // Detectar caracteres típicos del español (si los tiene, probablemente es español, no inglés)
    const spanishChars = /[áéíóúñüÁÉÍÓÚÑÜ]/;
    if (spanishChars.test(text)) {
      return false; // Tiene caracteres españoles, no es el idioma objetivo
    }
    
    // Palabras comunes en español que indican que es una traducción
    const spanishCommonWords = [
      "el", "la", "los", "las", "un", "una", "unos", "unas",
      "de", "del", "en", "con", "por", "para", "sobre", "bajo",
      "es", "son", "está", "están", "fue", "fueron",
      "tengo", "tiene", "tenemos", "tienen",
      "soy", "eres", "somos", "son",
      "yo", "tú", "él", "ella", "nosotros", "vosotros", "ellos", "ellas",
      "mi", "tu", "su", "nuestro", "vuestro", "su",
      "que", "cual", "cuando", "donde", "como", "porque",
      "y", "o", "pero", "sin", "entre", "hasta", "desde"
    ];
    
    const words = textLower.split(/\s+/).filter(w => w.length > 0);
    const cleanWords = words.map(w => w.replace(/[.,;:!?()\[\]{}'"]/g, ''));
    
    // Contar palabras comunes en español
    const spanishWordCount = cleanWords.filter(word => 
      spanishCommonWords.includes(word)
    ).length;
    
    // Si más del 30% de las palabras son comunes en español, probablemente es español
    if (words.length > 0 && spanishWordCount / words.length > 0.3) {
      return false;
    }
    
    // Detectar si es inglés (idioma objetivo más común)
    if (langLower.includes("inglés") || langLower.includes("english")) {
      // Palabras comunes en inglés
      const englishCommonWords = [
        "the", "a", "an", "is", "are", "was", "were", "be", "been",
        "have", "has", "had", "do", "does", "did", "will", "would",
        "i", "you", "he", "she", "it", "we", "they",
        "my", "your", "his", "her", "its", "our", "their",
        "and", "or", "but", "with", "from", "to", "of", "in", "on", "at",
        "this", "that", "these", "those", "what", "which", "who", "where", "when", "how", "why"
      ];
      
      const englishWordCount = cleanWords.filter(word => 
        englishCommonWords.includes(word)
      ).length;
      
      // Si tiene palabras comunes en inglés, probablemente es inglés
      if (englishWordCount > 0) {
        return true;
      }
      
      // Si es una palabra/frase corta sin caracteres especiales, verificar más cuidadosamente
      if (words.length <= 5 && !spanishChars.test(text)) {
        // Verificar que no sea una palabra común en español sin acentos
        const spanishWordsWithoutAccents = ["el", "la", "de", "en", "con", "por", "para", "que", "es", "son", "un", "una"];
        const isSpanishWord = spanishWordsWithoutAccents.some(word => textLower === word || cleanWords.includes(word));
        
        if (!isSpanishWord) {
          // Si parece una palabra/frase en inglés (solo letras, sin acentos), probablemente es inglés
          // Pero solo si no parece español
          if (spanishWordCount === 0 || (words.length > 1 && spanishWordCount / words.length < 0.2)) {
            return true;
          }
        }
      }
      
      return false;
    }
    
    // Para otros idiomas, usar una lógica similar pero adaptada
    // Por ahora, si no tiene caracteres españoles y no parece español, asumir que es el idioma objetivo
    return !spanishChars.test(text) && (words.length === 0 || spanishWordCount / words.length < 0.2);
  };
  
  // Procesar bloques de video antes de renderizar
  const processVideoBlocks = (text: string): (string | React.ReactElement)[] => {
    const videoBlockRegex = /<youtube-video\s+([^>]+)\s*\/>/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;
    let partIndex = 0;
    
    while ((match = videoBlockRegex.exec(text)) !== null) {
      // Añadir texto antes del video
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Parsear atributos del video
      const attrs = match[1].match(/(\w+)="([^"]+)"/g) || [];
      const videoProps: { [key: string]: string } = {};
      attrs.forEach(attr => {
        const attrMatch = attr.match(/(\w+)="([^"]+)"/);
        if (attrMatch) {
          videoProps[attrMatch[1]] = attrMatch[2];
        }
      });
      
      const videoId = videoProps.id || "";
      const videoTitle = videoProps.title || "Video de YouTube";
      
      if (videoId) {
        parts.push(
          <div key={`video-${partIndex++}`} style={{
            margin: "1.5rem 0",
            borderRadius: "12px",
            overflow: "hidden",
            border: `1px solid ${borderColor}`,
          }}>
            <div style={{
              padding: "1rem",
              background: colorTheme === "dark" ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.08)",
              borderBottom: `1px solid ${borderColor}`,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}>
                <span style={{ fontSize: "1.2rem" }}>🎬</span>
                <strong style={{ color: textColor }}>{videoTitle}</strong>
              </div>
            </div>
            <div style={{
              position: "relative",
              paddingBottom: "56.25%", // 16:9 aspect ratio
              height: 0,
              overflow: "hidden",
            }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          </div>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Añadir texto restante
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : [text];
  };
  
  const processedContent = processVideoBlocks(content);
  
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
  
  return (
    <div style={{
      padding: "2rem",
      background: bgColor,
      borderRadius: "12px",
      border: `1px solid ${borderColor}`,
      boxShadow: colorTheme === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
    }}>
      {/* Header similar a flashcards */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        paddingBottom: "1rem",
        borderBottom: `1px solid ${borderColor}`,
      }}>
        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: textColor }}>
          Resumen de Estudio
        </h3>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: isGeneratingPDF
              ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.05)")
              : "#6366f1",
            color: isGeneratingPDF
              ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.5)" : "rgba(148, 163, 184, 0.7)")
              : "white",
            border: `1px solid ${isGeneratingPDF ? borderColor : "#6366f1"}`,
            borderRadius: "16px",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: isGeneratingPDF ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: isGeneratingPDF ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isGeneratingPDF) {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.transform = "scale(1.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isGeneratingPDF) {
              e.currentTarget.style.background = "#6366f1";
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          {isGeneratingPDF ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Generando...
            </>
          ) : (
            <>
              <DownloadIcon size={16} />
              PDF
            </>
          )}
        </button>
      </div>

      {/* Contenido del resumen */}
      <div style={{ position: "relative", width: "100%" }}>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .notes-viewer :global(h1) {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 700;
          margin: 3rem 0 2rem;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
          letter-spacing: -0.02em;
          line-height: 1.2;
          text-decoration: none !important;
        }
        .notes-viewer :global(h2) {
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: 600;
          margin: 2.5rem 0 1.5rem;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
          padding: 0.75rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none !important;
        }
        .notes-viewer :global(h3) {
          font-size: clamp(1.25rem, 3vw, 1.5rem);
          font-weight: 600;
          margin: 2rem 0 1rem;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
          padding-left: 0.75rem;
          border-left: 3px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"};
          text-decoration: none !important;
        }
        .notes-viewer :global(h4) {
          font-size: clamp(1.1rem, 2.5vw, 1.3rem);
          font-weight: 600;
          margin: 1.5rem 0 0.75rem;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
          text-decoration: none !important;
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
          text-decoration: none !important;
        }
        .notes-viewer :global(strong *), .notes-viewer :global(* strong) {
          text-decoration: none !important;
        }
        .notes-viewer :global(h1), .notes-viewer :global(h2), .notes-viewer :global(h3), .notes-viewer :global(h4), .notes-viewer :global(h5), .notes-viewer :global(h6) {
          text-decoration: none !important;
        }
        .notes-viewer :global(h1 *), .notes-viewer :global(h2 *), .notes-viewer :global(h3 *), .notes-viewer :global(h4 *), .notes-viewer :global(h5 *), .notes-viewer :global(h6 *) {
          text-decoration: none !important;
        }
        .notes-viewer :global(p strong), .notes-viewer :global(li strong), .notes-viewer :global(div strong), .notes-viewer :global(span strong) {
          text-decoration: none !important;
        }
        .notes-viewer :global(strong strong) {
          text-decoration: none !important;
        }
        .notes-viewer :global(em) {
          color: #06b6d4;
          font-style: italic;
        }
        .notes-viewer :global(code) {
          background: none !important;
          background-color: transparent !important;
          padding: 0;
          border-radius: 0;
          font-family: ${jetbrainsMono.style.fontFamily};
          font-size: 0.95em;
          color: ${colorTheme === "dark" ? "#22d3ee" : "#0891b2"};
          border: none !important;
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
          border-left: 1px solid ${colorTheme === "dark"
            ? "rgba(148, 163, 184, 0.15)"
            : "rgba(148, 163, 184, 0.3)"};
          border-right: 1px solid ${colorTheme === "dark"
            ? "rgba(148, 163, 184, 0.15)"
            : "rgba(148, 163, 184, 0.3)"};
          border-top: none;
          border-bottom: none;
          padding: 1rem 1.25rem;
          text-align: left;
          text-decoration: none;
        }
        .notes-viewer :global(th) {
          border-top: 1px solid ${colorTheme === "dark"
            ? "rgba(148, 163, 184, 0.15)"
            : "rgba(148, 163, 184, 0.3)"};
        }
        .notes-viewer :global(tr:last-child td) {
          border-bottom: 1px solid ${colorTheme === "dark"
            ? "rgba(148, 163, 184, 0.15)"
            : "rgba(148, 163, 184, 0.3)"};
        }
        .notes-viewer :global(th *), .notes-viewer :global(td *) {
          text-decoration: none;
        }
        .notes-viewer :global(th) {
          background: none !important;
          background-color: transparent !important;
          font-weight: 700;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
          font-size: 1.05rem;
        }
        .notes-viewer :global(td) {
          background: none !important;
          background-color: transparent !important;
        }
        .notes-viewer :global(tr:hover td) {
          background: none !important;
          background-color: transparent !important;
        }
        .notes-viewer :global(hr) {
          border: none;
          border-top: 3px solid rgba(99, 102, 241, 0.3);
          margin: 3rem 0;
          border-radius: 2px;
        }
        .notes-viewer :global(a) {
          color: ${colorTheme === "dark" ? "#60a5fa" : "#2563eb"};
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: ${colorTheme === "dark" ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.1)"};
          border-radius: 8px;
          border: 1px solid ${colorTheme === "dark" ? "rgba(96, 165, 250, 0.3)" : "rgba(37, 99, 235, 0.3)"};
          transition: all 0.2s ease;
          font-weight: 500;
          margin: 0.25rem 0;
        }
        .notes-viewer :global(a::before) {
          content: "🔗";
          font-size: 1rem;
        }
        .notes-viewer :global(a:hover) {
          background: ${colorTheme === "dark" ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.2)"};
          border-color: ${colorTheme === "dark" ? "rgba(96, 165, 250, 0.5)" : "rgba(37, 99, 235, 0.5)"};
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${colorTheme === "dark" ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.2)"};
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
        <div
          ref={notesContainerRef}
          style={{
            padding: "2rem",
            background: bgColor,
            borderRadius: "12px",
            border: `1px solid ${borderColor}`,
            boxShadow: colorTheme === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
            maxWidth: "100%",
            width: "100%",
          }}
        >
          {/* Header similar a flashcards */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: `1px solid ${borderColor}`,
          }}>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: textColor }}>
              Resumen de Estudio
            </h3>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: "#6366f1",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: isGeneratingPDF ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "all 0.2s ease",
                opacity: isGeneratingPDF ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isGeneratingPDF) {
                  e.currentTarget.style.background = "#4f46e5";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isGeneratingPDF) {
                  e.currentTarget.style.background = "#6366f1";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <DownloadIcon size={16} color="#ffffff" />
              {isGeneratingPDF ? "Generando..." : "PDF"}
            </button>
          </div>
          <div
            style={{
              maxWidth: "100%",
              lineHeight: 1.8,
              color: textColor,
              fontSize: "0.95rem",
            }}
            className="notes-viewer"
          >
            {processedContent.map((part, index) => {
              if (typeof part === 'string') {
                return (
                  <ReactMarkdown key={`text-${index}`} remarkPlugins={[remarkGfm]} components={{
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
          strong: ({ ...props }: { children?: React.ReactNode }) => {
            const text = String(props.children || "");
            // Si es un idioma y el texto en negrita es del idioma objetivo, añadir botón de audio
            if (isLanguage && language && text.length > 0 && text.length < 50) {
              // No añadir en palabras comunes como "Definición:", "Ejemplo:", etc.
              const commonWords = ["definición", "ejemplo", "importante", "concepto", "regla", "nota"];
              const isCommonWord = commonWords.some(word => text.toLowerCase().includes(word));
              
              // Verificar que el texto sea del idioma objetivo (no una traducción)
              const isTargetLang = isTargetLanguageText(text, language);
              
              if (!isCommonWord && !text.includes(":") && !text.match(/^\d+$/) && isTargetLang) {
                return (
                  <strong {...props} style={{ 
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    fontWeight: 700,
                  }}>
                    {props.children}
                    <AudioButton text={text} language={language} colorTheme={colorTheme} size={16} />
                  </strong>
                );
              }
            }
            return <strong {...props} style={{ fontWeight: 700 }} />;
          },
          td: ({ ...props }: { children?: React.ReactNode }) => {
            // Añadir botones de audio solo en celdas con texto del idioma objetivo (no traducciones)
            if (isLanguage && language) {
              const cellText = String(props.children || "").trim();
              // Verificar que el texto sea del idioma objetivo (no una traducción)
              const isTargetLang = isTargetLanguageText(cellText, language);
              
              if (cellText.length > 0 && cellText.length < 100 && !cellText.match(/^[|:\- ]+$/) && isTargetLang) {
                // No añadir en encabezados de tabla o separadores
                if (!cellText.includes("Vocabulario") && !cellText.includes("Traducción") && 
                    !cellText.includes("Contexto") && !cellText.includes("---") &&
                    !cellText.includes("Vocabulary") && !cellText.includes("Translation")) {
                  return (
                    <td {...props}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                        {props.children}
                        <AudioButton text={cellText} language={language} colorTheme={colorTheme} size={14} />
                      </div>
                    </td>
                  );
                }
              }
            }
            return <td {...props} />;
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
                
                // Usar SIEMPRE SectionBasedSchemaRenderer (diseño de la segunda imagen)
                console.log('Parsed diagram data:', diagramData);
                
                // Encontrar nodos hijos
                interface DiagramNode {
                  id: string;
                  label: string;
                  color?: string;
                }
                interface DiagramEdge {
                  from: string;
                  to: string;
                }
                const rootNodes = diagramData.nodes.filter((node: DiagramNode) => {
                  const hasIncoming = (diagramData.edges || []).some((edge: DiagramEdge) => edge.to === node.id);
                  return !hasIncoming;
                });
                const rootNode = rootNodes[0] || diagramData.nodes[0];
                console.log('Root node:', rootNode);
                
                let childNodes = diagramData.nodes.filter((node: DiagramNode) => {
                  if (node.id === rootNode.id) return false;
                  if ((diagramData.edges || []).length === 0) {
                    return true;
                  }
                  return (diagramData.edges || []).some((edge: DiagramEdge) => edge.from === rootNode.id && edge.to === node.id);
                });
                
                if (childNodes.length === 0 && diagramData.nodes.length > 1) {
                  childNodes = diagramData.nodes.slice(1);
                }
                
                console.log('Child nodes:', childNodes);
                console.log('Using SectionBasedSchemaRenderer with:', {
                  ...diagramData,
                  title: diagramData.title || rootNode.label,
                });
                
                // Usar SectionBasedSchemaRenderer para todos los esquemas
                return (
                  <SectionBasedSchemaRenderer 
                    data={{
                      ...diagramData,
                      title: diagramData.title || rootNode.label,
                    }} 
                    colorTheme={colorTheme} 
                  />
                );
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
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: colorTheme === "dark" ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.1)",
                borderRadius: "8px",
                border: `1px solid ${colorTheme === "dark" ? "rgba(96, 165, 250, 0.3)" : "rgba(37, 99, 235, 0.3)"}`,
                color: colorTheme === "dark" ? "#60a5fa" : "#2563eb",
                textDecoration: "none",
                fontWeight: 500,
                margin: "0.25rem 0",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colorTheme === "dark" ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.2)";
                e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(96, 165, 250, 0.5)" : "rgba(37, 99, 235, 0.5)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${colorTheme === "dark" ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.2)"}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colorTheme === "dark" ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.1)";
                e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(96, 165, 250, 0.3)" : "rgba(37, 99, 235, 0.3)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span>🔗</span>
              {children}
            </a>
          ),
        }}
              >
                {part}
              </ReactMarkdown>
                );
              }
              return part;
            })}
            </div>
          </div>
        </div>
      </div>
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [questionResults, setQuestionResults] = useState<Record<string, { isCorrect: boolean; showFeedback: boolean }>>({});
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test.questions.length;
  const progress = (answeredCount / totalQuestions) * 100;
  const currentQuestion = test.questions[currentQuestionIndex];
  
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
    ? "rgba(26, 26, 36, 0.8)"
    : "#ffffff";
  const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
  const secondaryTextColor = colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563";
  
  return (
    <div
      style={{
        background: bgColor,
        borderRadius: "24px",
        padding: "1.5rem",
        border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)"}`,
        boxShadow: colorTheme === "dark"
          ? "0 2px 8px rgba(0, 0, 0, 0.2)"
          : "0 2px 8px rgba(0, 0, 0, 0.08)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header del Test */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <TestIcon size={20} color="#6366f1" />
              <h3
                style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: textColor,
                  margin: 0,
                }}
              >
                Test de Evaluación
              </h3>
            <span style={{ fontSize: "0.875rem", color: secondaryTextColor }}>
              · Nivel: {test.user_level !== undefined ? `${test.user_level}/10` : test.difficulty}
            </span>
          </div>
          
          {/* Puntuación en tiempo real */}
          {answeredCount > 0 && (
            <div style={{
              padding: "0.5rem 1rem",
              background: colorTheme === "dark"
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(16, 185, 129, 0.08)",
              borderRadius: "12px",
              border: `1px solid ${colorTheme === "dark" ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: "0.75rem", color: secondaryTextColor, marginBottom: "0.25rem" }}>
                Puntuación
              </div>
              <div style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#10b981",
              }}>
                {currentScore.toFixed(0)}%
              </div>
            </div>
          )}
        </div>
        
        {/* Barra de progreso */}
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              color: secondaryTextColor,
              fontWeight: 500,
            }}
          >
            <span>Progreso: {answeredCount}/{totalQuestions} preguntas</span>
            <span style={{ fontWeight: 600, color: "#6366f1" }}>{Math.round(progress)}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#6366f1",
                borderRadius: "8px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Navegación de preguntas */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1.5rem",
        gap: "1rem"
      }}>
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: currentQuestionIndex === 0
              ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.15)")
              : (colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "#ffffff"),
            border: `1px solid ${currentQuestionIndex === 0 
              ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)")
              : (colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)")}`,
            borderRadius: "12px",
            color: currentQuestionIndex === 0 
              ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.5)" : "rgba(148, 163, 184, 0.6)")
              : textColor,
            cursor: currentQuestionIndex === 0 ? "not-allowed" : "pointer",
            fontWeight: 500,
            fontSize: "0.875rem",
            transition: "all 0.2s ease",
            opacity: currentQuestionIndex === 0 ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (currentQuestionIndex > 0) {
              e.currentTarget.style.background = colorTheme === "dark" 
                ? "rgba(148, 163, 184, 0.15)" 
                : "rgba(148, 163, 184, 0.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentQuestionIndex > 0) {
              e.currentTarget.style.background = colorTheme === "dark" 
                ? "rgba(26, 26, 36, 0.8)" 
                : "#ffffff";
            }
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>‹</span>
          <span>Anterior</span>
        </button>

        <div style={{
          padding: "0.5rem 1rem",
          background: colorTheme === "dark" 
            ? "rgba(26, 26, 36, 0.8)" 
            : "#ffffff",
          borderRadius: "12px",
          border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)"}`,
          fontWeight: 500,
          color: textColor,
          fontSize: "0.875rem",
        }}>
          Pregunta {currentQuestionIndex + 1} de {totalQuestions}
        </div>

        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
          disabled={currentQuestionIndex === totalQuestions - 1}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: currentQuestionIndex === totalQuestions - 1
              ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.15)")
              : (colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "#ffffff"),
            border: `1px solid ${currentQuestionIndex === totalQuestions - 1 
              ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)")
              : (colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)")}`,
            borderRadius: "12px",
            color: currentQuestionIndex === totalQuestions - 1 
              ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.5)" : "rgba(148, 163, 184, 0.6)")
              : textColor,
            cursor: currentQuestionIndex === totalQuestions - 1 ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "0.875rem",
            transition: "all 0.2s ease",
            opacity: currentQuestionIndex === totalQuestions - 1 ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (currentQuestionIndex < totalQuestions - 1) {
              e.currentTarget.style.background = colorTheme === "dark" 
                ? "rgba(148, 163, 184, 0.15)" 
                : "rgba(148, 163, 184, 0.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentQuestionIndex < totalQuestions - 1) {
              e.currentTarget.style.background = colorTheme === "dark" 
                ? "rgba(26, 26, 36, 0.8)" 
                : "#ffffff";
            }
          }}
        >
          <span>Siguiente</span>
          <span style={{ fontSize: "1.25rem" }}>›</span>
        </button>
      </div>

      {/* Pregunta actual */}
      <div style={{ marginBottom: "2rem", width: "100%", boxSizing: "border-box" }}>
        {currentQuestion && (() => {
          const q = currentQuestion;
          const isAnswered = answers[q.id] !== undefined;
          const result = questionResults[q.id];
          const isCorrect = result?.isCorrect ?? false;
          const showFeedback = result?.showFeedback ?? false;
          const correctAnswer = q.correct_answer;
          
          // Determinar colores según el resultado
          let questionBg = colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "#ffffff";
          let questionBorder = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";
          
          if (showFeedback) {
            if (isCorrect) {
              questionBg = colorTheme === "dark" 
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(16, 185, 129, 0.08)";
              questionBorder = colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)";
            } else {
              questionBg = colorTheme === "dark"
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(239, 68, 68, 0.08)";
              questionBorder = colorTheme === "dark" ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.4)";
            }
          }
          
          return (
            <div
              key={q.id}
              style={{
                width: "100%",
                marginBottom: "1.5rem",
                padding: "1.25rem",
                background: questionBg,
                borderRadius: "16px",
                border: `1px solid ${questionBorder}`,
                transition: "all 0.2s ease",
                position: "relative",
                boxSizing: "border-box",
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
                    currentQuestionIndex + 1
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
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "0.75rem",
                    marginTop: "1rem",
                    width: "100%",
                    boxSizing: "border-box",
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
                            color: isSelectedOption 
                              ? "white" 
                              : (colorTheme === "dark" ? "rgba(148, 163, 184, 0.7)" : "#64748b"),
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
              
              {/* Feedback con explicación para multiple_choice */}
              {q.type === "multiple_choice" && showFeedback && (
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
                  <div style={{ marginTop: "0.125rem", flexShrink: 0 }}>
                    <LightbulbIcon size={18} color={isCorrect ? "#10b981" : "#f59e0b"} />
                  </div>
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
                    width: "100%",
                    boxSizing: "border-box",
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
                          padding: "0.75rem 1rem",
                          background: isSelectedOption
                            ? (colorTheme === "dark" 
                                ? (tf === "True" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)")
                                : (tf === "True" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"))
                            : (colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "#ffffff"),
                          borderRadius: "12px",
                          border: isSelectedOption
                            ? `1px solid ${tf === "True" ? "#10b981" : "#ef4444"}`
                            : `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)"}`,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelectedOption) {
                            e.currentTarget.style.background = colorTheme === "dark" 
                              ? "rgba(148, 163, 184, 0.1)" 
                              : "rgba(148, 163, 184, 0.08)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelectedOption) {
                            e.currentTarget.style.background = colorTheme === "dark" 
                              ? "rgba(26, 26, 36, 0.8)" 
                              : "#ffffff";
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
              {q.type === "true_false" && showFeedback && (
                <div style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: isCorrect
                    ? (colorTheme === "dark" ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)")
                    : (colorTheme === "dark" ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.08)"),
                  borderRadius: "12px",
                  border: `1px solid ${isCorrect 
                    ? (colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)")
                    : (colorTheme === "dark" ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.4)")}`,
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
                  <div style={{ marginTop: "0.125rem", flexShrink: 0 }}>
                    <LightbulbIcon size={18} color={isCorrect ? "#10b981" : "#f59e0b"} />
                  </div>
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
        })()}
      </div>

      {/* Botón de envío */}
      <button
        onClick={onSubmit}
        disabled={answeredCount !== totalQuestions}
        style={{
          width: "100%",
          padding: "0.5rem 1rem",
          background:
            answeredCount === totalQuestions
              ? "#10b981"
              : (colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "#ffffff"),
          border: `1px solid ${answeredCount === totalQuestions
            ? "#10b981"
            : (colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)")}`,
          borderRadius: "12px",
          color: answeredCount === totalQuestions 
            ? "white" 
            : (colorTheme === "dark" ? "rgba(148, 163, 184, 0.5)" : "rgba(148, 163, 184, 0.6)"),
          fontSize: "0.875rem",
          fontWeight: answeredCount === totalQuestions ? 600 : 500,
          cursor: answeredCount === totalQuestions ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
          opacity: answeredCount === totalQuestions ? 1 : 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          if (answeredCount === totalQuestions) {
            e.currentTarget.style.background = "#059669";
          } else {
            e.currentTarget.style.background = colorTheme === "dark" 
              ? "rgba(148, 163, 184, 0.15)" 
              : "rgba(148, 163, 184, 0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (answeredCount === totalQuestions) {
            e.currentTarget.style.background = "#10b981";
          } else {
            e.currentTarget.style.background = colorTheme === "dark" 
              ? "rgba(26, 26, 36, 0.8)" 
              : "#ffffff";
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
  // Detectar si es un mensaje de felicitaciones por subir de nivel
  let isLevelUpMessage = false;
  let messageContent = "";
  
  if (typeof data === 'string') {
    messageContent = data;
    // Detectar si contiene indicadores de mensaje de felicitaciones (variaciones de "felicidades")
    isLevelUpMessage = data.includes("Felicitaciones") || 
                      data.includes("Felicidades") || 
                      data.includes("felicidades") ||
                      data.includes("subido al nivel") || 
                      data.includes("subido") ||
                      data.includes("🎉") ||
                      data.includes("niveles") ||
                      data.includes("puntos de experiencia");
  }
  
  // Si es un mensaje de felicitaciones, renderizarlo de forma especial
  if (isLevelUpMessage) {
    // Renderizar mensaje de felicitaciones inline
    const bgColor = colorTheme === "dark" 
      ? "linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))"
      : "linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.08))";
    const borderColor = colorTheme === "dark" 
      ? "rgba(251, 191, 36, 0.4)"
      : "rgba(251, 191, 36, 0.5)";
    const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";

    return (
      <div
        style={{
          background: bgColor,
          borderRadius: "20px",
          padding: "2.5rem",
          border: `2px solid ${borderColor}`,
          boxShadow: colorTheme === "dark"
            ? "0 8px 32px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
            : "0 8px 32px rgba(251, 191, 36, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
          width: "100%",
        }}
      >
        {/* Header con icono de celebración */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          gap: "1rem", 
          marginBottom: "2rem" 
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 16px rgba(251, 191, 36, 0.4)",
          }}>
            <StarIcon size={32} color="white" />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{
              margin: 0,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              color: textColor,
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              ¡Felicitaciones!
            </h2>
          </div>
        </div>

        {/* Contenido del mensaje */}
        <div
          style={{
            lineHeight: 1.8,
            color: textColor,
            fontSize: "1.1rem",
          }}
          className="message-content"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ ...props }) => <h1 {...props} style={{ textDecoration: "none", borderBottom: "none", fontSize: "1.5rem", marginTop: "1rem", marginBottom: "0.5rem" }} />,
              h2: ({ ...props }) => <h2 {...props} style={{ textDecoration: "none", borderBottom: "none", fontSize: "1.3rem", marginTop: "1rem", marginBottom: "0.5rem" }} />,
              h3: ({ ...props }) => <h3 {...props} style={{ textDecoration: "none", borderBottom: "none", fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem" }} />,
              strong: ({ ...props }) => <strong {...props} style={{ 
                textDecoration: "none !important", 
                borderBottom: "none !important",
                fontWeight: 700,
                color: "#fbbf24",
              }} />,
              p: ({ ...props }) => <p {...props} style={{ margin: "1rem 0", textDecoration: "none", fontSize: "1.1rem" }} />,
              li: ({ ...props }) => <li {...props} style={{ textDecoration: "none", marginBottom: "0.5rem", fontSize: "1.05rem" }} />,
              ul: ({ ...props }) => <ul {...props} style={{ margin: "1rem 0", paddingLeft: "1.5rem" }} />,
            }}
          >
            {messageContent}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
  
  // Si no, procesar como mensaje de éxito normal (archivos procesados)
  // Solo intentar parsear como JSON si parece ser JSON válido
  let successData: unknown;
  
  try {
    if (typeof data === 'string') {
      // Solo intentar parsear si parece ser JSON (empieza con { o [)
      const trimmed = data.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      successData = JSON.parse(data);
      } else {
        // Si no es JSON, tratarlo como string simple
        console.warn("SuccessMessage: data is string but not JSON, treating as plain text");
        return null;
      }
    } else if (typeof data === 'object' && data !== null) {
      successData = data;
    } else {
      throw new Error('Invalid success data');
    }
  } catch (error) {
    console.error("Error parsing success data", error);
    // Si falla el parsing, no renderizar nada en lugar de crashear
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
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: 600,
            color: textColor,
            marginBottom: "0.5rem",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
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
            {fileNames.map((fileName: string) => (
              <li key={fileName} style={{
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
          marginBottom: "1.5rem",
          fontSize: "clamp(1.1rem, 2.5vw, 1.3rem)",
          fontWeight: 600,
          color: textColor,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          letterSpacing: "-0.01em",
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
    failedQuestions?: { question: string; userAnswer: string; correctAnswer: string; explanation?: string; options?: string[]; type?: string }[];
    recommendations?: string[];
  };
  
  // Función para obtener el texto de la opción desde la letra
  const getOptionText = (letter: string, options?: string[], type?: string): string => {
    if (!options || options.length === 0) {
      // Si no hay opciones, devolver la letra o el valor directamente
      if (type === "true_false") {
        return letter === "True" ? "Verdadero" : "Falso";
      }
      return letter;
    }
    
    // Convertir letra a índice (A=0, B=1, C=2, D=3, etc.)
    const index = letter.charCodeAt(0) - 65; // 'A' = 65
    if (index >= 0 && index < options.length) {
      const optionText = options[index];
      // Remover el prefijo "A) ", "B) ", etc. si existe
      return optionText.replace(/^[A-Z]\)\s*/, "").trim();
    }
    return letter;
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
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: 600,
              color: textColor,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}>
              Conceptos a Repasar ({failedQuestions.length})
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {(failedQuestions as { question: string; userAnswer: string; correctAnswer: string; explanation?: string; options?: string[]; type?: string }[]).map((failed, index: number) => (
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
                <div style={{ marginTop: "0.125rem", flexShrink: 0 }}>
                  <XIcon size={20} color="#ef4444" />
                </div>
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
                        <strong style={{ color: "#ef4444" }}>{getOptionText(failed.userAnswer, failed.options, failed.type)}</strong>
                      </div>
                      <div style={{
                        padding: "0.5rem 1rem",
                        background: colorTheme === "dark" ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                      }}>
                        <span style={{ color: secondaryTextColor }}>Correcta: </span>
                        <strong style={{ color: "#10b981" }}>{getOptionText(failed.correctAnswer, failed.options, failed.type)}</strong>
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
                    <div style={{ marginTop: "0.125rem", flexShrink: 0 }}>
                      <LightbulbIcon size={18} color="#f59e0b" />
                    </div>
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
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: 600,
              color: textColor,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
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
            <div style={{ marginTop: "0.125rem", flexShrink: 0 }}>
              <ZapIcon size={18} color="#6366f1" />
            </div>
                <span style={{ color: textColor, lineHeight: 1.6 }}>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar el ejercicio
function ExerciseComponent({ 
  exercise, 
  answer, 
  answerImage,
  onAnswerChange, 
  onAnswerImageChange,
  onImageRemove,
  imageInputRef,
  onSubmit, 
  colorTheme 
}: { 
  exercise: Exercise; 
  answer: string; 
  answerImage: string | null;
  onAnswerChange: (answer: string) => void; 
  onAnswerImageChange: (image: string | null) => void;
  onImageRemove: () => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: () => void; 
  colorTheme: "light" | "dark" 
}) {
  const bgColor = colorTheme === "dark" 
    ? "rgba(26, 26, 36, 0.95)"
    : "#ffffff";
  const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
  const secondaryTextColor = colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563";
  const borderColor = colorTheme === "dark" 
    ? "rgba(148, 163, 184, 0.2)" 
    : "rgba(148, 163, 184, 0.3)";
  
  // Función helper para detectar si es un lenguaje de programación
  const isProgrammingLanguage = (topic: string): boolean => {
    const topicLower = topic.toLowerCase();
    return topicLower.includes("python") ||
      topicLower.includes("javascript") || topicLower.includes("js") ||
      topicLower.includes("java") ||
      topicLower.includes("sql") ||
      topicLower.includes("typescript") ||
      topicLower.includes("c++") || topicLower.includes("cpp") ||
      topicLower.includes("react") ||
      topicLower.includes("html") || topicLower.includes("css") ||
      topicLower.includes("swift") ||
      topicLower.includes("programación") || topicLower.includes("programming");
  };
  
  // Detectar si es un ejercicio de programación
  const topics = exercise.topics || [];
  const topicsStr = topics.join(" ").toLowerCase();
  console.log("[ExerciseComponent] Topics:", topics, "Topics string:", topicsStr);
  
  const isProgramming = isProgrammingLanguage(topicsStr) || 
    topics.some(t => isProgrammingLanguage(t.toLowerCase()));
  
  console.log("[ExerciseComponent] Is programming:", isProgramming);
  
  const programmingLanguage = topics.find(t => {
    const tLower = t.toLowerCase();
    if (tLower.includes("python")) return "Python";
    if (tLower.includes("javascript") || tLower.includes("js")) return "JavaScript";
    if (tLower.includes("java")) return "Java";
    if (tLower.includes("sql")) return "SQL";
    return null;
  }) || (isProgramming ? "Python" : null);
  
  console.log("[ExerciseComponent] Programming language:", programmingLanguage);

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: "12px",
        padding: "1.5rem",
        border: `1px solid ${borderColor}`,
        boxShadow: colorTheme === "dark"
          ? "0 2px 8px rgba(0, 0, 0, 0.2)"
          : "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{
          margin: "0 0 1rem 0",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: textColor,
        }}>
          Ejercicio
        </h3>
        <div style={{
          padding: "1.5rem",
          background: colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
          borderRadius: "12px",
          marginBottom: "1rem",
          border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.15)"}`,
        }}>
          <div style={{
            color: textColor,
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            fontSize: "1rem",
          }}>
            {(() => {
              // Procesar el enunciado para destacar palabras clave
              const statement = exercise.statement || "Cargando enunciado...";
              
              // Palabras clave comunes a destacar
              const keywords = [
                // SQL
                'SELECT', 'FROM', 'WHERE', 'UPDATE', 'DELETE', 'INSERT', 'CREATE', 'ALTER', 'DROP',
                'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
                'GROUP BY', 'ORDER BY', 'HAVING', 'DISTINCT', 'UNION', 'AS',
                'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
                'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
                // Programación general
                'function', 'variable', 'array', 'object', 'class', 'method', 'return',
                'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue',
                'const', 'let', 'var', 'import', 'export', 'async', 'await',
                // Conceptos importantes
                'query', 'database', 'table', 'column', 'row', 'primary key', 'foreign key',
                'index', 'constraint', 'transaction', 'commit', 'rollback',
                'API', 'endpoint', 'request', 'response', 'JSON', 'XML',
                'algorithm', 'data structure', 'time complexity', 'space complexity',
                // Instrucciones
                'escribe', 'crea', 'implementa', 'diseña', 'calcula', 'determina', 'explica',
                'debe', 'debe ser', 'debe tener', 'requiere', 'necesita',
                'importante', 'nota', 'recuerda', 'considera', 'ten en cuenta',
              ];
              
              // Crear expresión regular para encontrar palabras clave (case insensitive)
              const keywordPattern = new RegExp(
                `\\b(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
                'gi'
              );
              
              // Dividir el texto en partes y destacar palabras clave
              const parts: (string | React.ReactElement)[] = [];
              let lastIndex = 0;
              let match;
              
              while ((match = keywordPattern.exec(statement)) !== null) {
                // Agregar texto antes de la palabra clave
                if (match.index > lastIndex) {
                  parts.push(statement.substring(lastIndex, match.index));
                }
                
                // Agregar palabra clave destacada en negrita
                parts.push(
                  <strong key={match.index} style={{
                    color: textColor,
                    fontWeight: 700,
                  }}>
                    {match[0]}
                  </strong>
                );
                
                lastIndex = match.index + match[0].length;
              }
              
              // Agregar texto restante
              if (lastIndex < statement.length) {
                parts.push(statement.substring(lastIndex));
              }
              
              // Si no se encontraron palabras clave, devolver el texto original
              if (parts.length === 0) {
                return statement;
              }
              
              return <>{parts}</>;
            })()}
          </div>
        </div>
        {exercise.hints && exercise.hints.length > 0 && (
          <div style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            background: colorTheme === "dark" ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)",
            borderRadius: "8px",
            border: `1px solid ${colorTheme === "dark" ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.4)"}`,
          }}>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: secondaryTextColor,
              marginBottom: "0.5rem",
            }}>
              Pistas:
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: "1.25rem",
              color: textColor,
            }}>
              {exercise.hints.map((hint) => (
                <li key={hint} style={{ marginBottom: "0.25rem" }}>
                  {hint}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Mostrar intérprete de código si es un ejercicio de programación */}
      {isProgramming && programmingLanguage && (
        <div style={{ marginBottom: "1.5rem" }}>
          <CodeInterpreter
            language={programmingLanguage}
            colorTheme={colorTheme}
            initialCode={answer}
            onCodeChange={(code) => onAnswerChange(code)}
          />
        </div>
      )}
      
      <div style={{ marginBottom: "1rem" }}>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: textColor,
          marginBottom: "0.5rem",
        }}>
          Tu respuesta:
        </label>
        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Escribe tu respuesta aquí..."
          style={{
            width: "100%",
            minHeight: "120px",
            padding: "0.75rem",
            background: colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "#f8f9fa",
            border: `1px solid ${borderColor}`,
            borderRadius: "8px",
            color: textColor,
            fontSize: "0.95rem",
            fontFamily: "inherit",
            resize: "vertical",
            boxSizing: "border-box",
            marginBottom: "0.75rem",
          }}
        />
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  onAnswerImageChange(reader.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              height: "48px",
              padding: "0 1rem",
              background: "#ffffff",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "24px",
              color: "#1a1a24",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8f9fa";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <UploadIcon size={20} color="#1a1a24" />
            <span>{answerImage ? "Cambiar imagen" : "Subir imagen"}</span>
          </button>
          {answerImage && (
            <>
              <div style={{
                position: "relative",
                maxWidth: "200px",
                maxHeight: "200px",
                borderRadius: "8px",
                overflow: "hidden",
                border: `1px solid ${borderColor}`,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={answerImage} 
                  alt="Respuesta" 
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={onImageRemove}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  height: "48px",
                  padding: "0 1rem",
                  background: "#ffffff",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "24px",
                  color: "#1a1a24",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8f9fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                <XIcon size={20} color="#1a1a24" />
                <span>Eliminar imagen</span>
              </button>
            </>
          )}
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={!answer.trim() && !answerImage}
        style={{
          width: "100%",
          padding: "0.75rem 1.5rem",
          background: answer.trim()
            ? (colorTheme === "dark" ? "#6366f1" : "#6366f1")
            : (colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(148, 163, 184, 0.2)"),
          border: "none",
          borderRadius: "8px",
          color: "white",
          fontSize: "0.95rem",
          fontWeight: 600,
          cursor: answer.trim() ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (answer.trim()) {
            e.currentTarget.style.background = colorTheme === "dark" ? "#5855eb" : "#5855eb";
          }
        }}
        onMouseLeave={(e) => {
          if (answer.trim()) {
            e.currentTarget.style.background = colorTheme === "dark" ? "#6366f1" : "#6366f1";
          }
        }}
      >
        Corregir Ejercicio
      </button>
    </div>
  );
}

// Componente para mostrar el resultado de la corrección
function ExerciseResultComponent({ 
  correction, 
  exercise, 
  colorTheme 
}: { 
  correction: ExerciseCorrection; 
  exercise: Exercise | null; 
  colorTheme: "light" | "dark" 
}) {
  const bgColor = colorTheme === "dark" 
    ? "rgba(26, 26, 36, 0.95)"
    : "#ffffff";
  const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
  const secondaryTextColor = colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563";
  const borderColor = colorTheme === "dark" 
    ? "rgba(148, 163, 184, 0.2)" 
    : "rgba(148, 163, 184, 0.3)";

  const scoreColor = correction.score_percentage >= 80 
    ? "#10b981" 
    : correction.score_percentage >= 60 
    ? "#f59e0b" 
    : "#ef4444";

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: "12px",
        padding: "1.5rem",
        border: `1px solid ${borderColor}`,
        boxShadow: colorTheme === "dark"
          ? "0 2px 8px rgba(0, 0, 0, 0.2)"
          : "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem 2rem",
          background: colorTheme === "dark" 
            ? `rgba(${scoreColor === "#10b981" ? "16, 185, 129" : scoreColor === "#f59e0b" ? "245, 158, 11" : "239, 68, 68"}, 0.15)` 
            : `rgba(${scoreColor === "#10b981" ? "16, 185, 129" : scoreColor === "#f59e0b" ? "245, 158, 11" : "239, 68, 68"}, 0.1)`,
          borderRadius: "12px",
          border: `2px solid ${scoreColor}40`,
        }}>
          <div>
            <div style={{ fontSize: "0.875rem", color: secondaryTextColor, marginBottom: "0.25rem" }}>
              Puntuación
            </div>
            <div style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: scoreColor,
            }}>
              {correction.score.toFixed(1)} / {exercise?.points || 10}
            </div>
            <div style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: scoreColor,
              marginTop: "0.25rem",
            }}>
              {correction.score_percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{
          margin: "0 0 1rem 0",
          fontSize: "1.125rem",
          fontWeight: 600,
          color: textColor,
        }}>
          Feedback General
        </h3>
        <div style={{
          padding: "1rem",
          background: colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
          borderRadius: "8px",
          border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
        }}>
          <p style={{
            margin: 0,
            color: textColor,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}>
            {correction.feedback}
          </p>
        </div>
      </div>

      {correction.strengths && correction.strengths.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#10b981",
          }}>
            Fortalezas:
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: "1.25rem",
            color: textColor,
          }}>
            {correction.strengths.map((strength, index) => (
              <li key={index} style={{ marginBottom: "0.5rem" }}>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {correction.weaknesses && correction.weaknesses.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#ef4444",
          }}>
            Debilidades:
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: "1.25rem",
            color: textColor,
          }}>
            {correction.weaknesses.map((weakness, index) => (
              <li key={index} style={{ marginBottom: "0.5rem" }}>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}

      {correction.suggestions && correction.suggestions.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#6366f1",
          }}>
            Sugerencias:
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: "1.25rem",
            color: textColor,
          }}>
            {correction.suggestions.map((suggestion, index) => (
              <li key={index} style={{ marginBottom: "0.5rem" }}>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {correction.detailed_analysis && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1rem",
            fontWeight: 600,
            color: textColor,
          }}>
            Análisis Detallado:
          </h4>
          <div style={{
            padding: "1rem",
            background: colorTheme === "dark" ? "rgba(26, 26, 36, 0.5)" : "rgba(248, 250, 252, 0.8)",
            borderRadius: "8px",
            border: `1px solid ${borderColor}`,
          }}>
            <p style={{
              margin: 0,
              color: textColor,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}>
              {correction.detailed_analysis}
            </p>
          </div>
        </div>
      )}

      {correction.correct_answer_explanation && (
        <div>
          <h4 style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#10b981",
          }}>
            Respuesta Correcta:
          </h4>
          <div style={{
            padding: "1rem",
            background: colorTheme === "dark" ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
            borderRadius: "8px",
            border: `1px solid ${colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)"}`,
          }}>
            <p style={{
              margin: 0,
              color: textColor,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}>
              {correction.correct_answer_explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para Text-to-Speech
function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const speak = (text: string, language: string, onEnd?: () => void) => {
    // Detener cualquier pronunciación anterior
    if (currentUtterance) {
      window.speechSynthesis.cancel();
    }

    // Mapear idiomas a códigos de voz
    const languageCodeMap: Record<string, string> = {
      "inglés": "en-US",
      "english": "en-US",
      "francés": "fr-FR",
      "francais": "fr-FR",
      "alemán": "de-DE",
      "deutsch": "de-DE",
      "italiano": "it-IT",
      "portugués": "pt-PT",
      "chino": "zh-CN",
      "chino simplificado": "zh-CN",
      "japonés": "ja-JP",
      "japones": "ja-JP",
      "coreano": "ko-KR",
      "catalán": "ca-ES",
      "catalan": "ca-ES",
      "ruso": "ru-RU",
    };

    const langKey = language.toLowerCase();
    const langCode = languageCodeMap[langKey] || "es-ES"; // Fallback a español

    if (!("speechSynthesis" in window)) {
      console.warn("Text-to-Speech no está disponible en este navegador");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9; // Velocidad ligeramente más lenta para mejor comprensión
    utterance.pitch = 1;
    utterance.volume = 1;

    // Intentar encontrar una voz nativa para el idioma
    const voices = window.speechSynthesis.getVoices();
    const nativeVoice = voices.find(voice => 
      voice.lang.startsWith(langCode.split("-")[0]) && 
      (voice.lang === langCode || voice.lang.includes(langCode.split("-")[1]))
    );
    
    if (nativeVoice) {
      utterance.voice = nativeVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentUtterance(utterance);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentUtterance(null);
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentUtterance(null);
    };

    // Cargar voces si no están disponibles
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        const updatedNativeVoice = updatedVoices.find(voice => 
          voice.lang.startsWith(langCode.split("-")[0]) && 
          (voice.lang === langCode || voice.lang.includes(langCode.split("-")[1]))
        );
        if (updatedNativeVoice) {
          utterance.voice = updatedNativeVoice;
        }
        window.speechSynthesis.speak(utterance);
      };
    } else {
      window.speechSynthesis.speak(utterance);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentUtterance(null);
  };

  return { speak, stop, isSpeaking };
}

// Componente de botón de audio
function AudioButton({ 
  text, 
  language, 
  colorTheme = "dark",
  size = 20
}: { 
  text: string; 
  language: string;
  colorTheme?: "dark" | "light";
  size?: number;
}) {
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, language);
    }
  };


  return (
    <button
      onClick={handleClick}
      title={isSpeaking ? "Detener pronunciación" : "Pronunciar"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5rem",
        background: colorTheme === "dark" 
          ? "rgba(99, 102, 241, 0.15)" 
          : "rgba(99, 102, 241, 0.12)",
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        color: colorTheme === "dark" ? "#818cf8" : "#6366f1",
        transition: "all 0.2s ease",
        opacity: isSpeaking ? 1 : 0.9,
        width: `${size + 16}px`,
        height: `${size + 16}px`,
        boxShadow: colorTheme === "dark" 
          ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
          : "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colorTheme === "dark" 
          ? "rgba(99, 102, 241, 0.25)" 
          : "rgba(99, 102, 241, 0.2)";
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = colorTheme === "dark" 
          ? "0 4px 8px rgba(0, 0, 0, 0.3)" 
          : "0 4px 8px rgba(0, 0, 0, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = colorTheme === "dark" 
          ? "rgba(99, 102, 241, 0.15)" 
          : "rgba(99, 102, 241, 0.12)";
        e.currentTarget.style.opacity = isSpeaking ? "1" : "0.9";
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = colorTheme === "dark" 
          ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
          : "0 2px 4px rgba(0, 0, 0, 0.1)";
      }}
    >
      {isSpeaking ? (
        <FaStop size={size} />
      ) : (
        <FaVolumeUp size={size} />
      )}
    </button>
  );
}

// Componente de flashcards para idiomas y temas generales
function LanguageFlashcards({
  language,
  level,
  colorTheme = "dark",
  apiKey,
  userId,
  setLearnedWordsCount,
  currentChatLevel,
  setCurrentChatLevel,
}: {
  language: string;
  level: number;
  colorTheme?: "dark" | "light";
  apiKey?: string;
  userId?: string;
  setLearnedWordsCount?: (count: number | ((prev: number) => number)) => void;
  currentChatLevel?: { topic: string; level: number } | null;
  setCurrentChatLevel?: (level: { topic: string; level: number }) => void;
}) {
  // Función helper para detectar si es un idioma (copiada del componente principal)
  const isLanguageTopic = (topic: string | null | undefined): boolean => {
    if (!topic) return false;
    const topicLower = topic.toLowerCase();
    
    // Lista de idiomas conocidos
    const knownLanguages = [
      "inglés", "english", "francés", "francais", "alemán", "deutsch", "german",
      "italiano", "italian", "portugués", "portuguese", "chino", "mandarín", "simplificado", "chinese",
      "japonés", "japanese", "japones", "coreano", "korean", "catalán", "catalan",
      "ruso", "russian", "español", "spanish", "árabe", "arabic", "hindi",
      "turco", "turkish", "polaco", "polish", "griego", "greek", "holandés", "dutch",
      "sueco", "swedish", "noruego", "norwegian", "danés", "danish", "finlandés", "finnish",
      "checo", "czech", "rumano", "romanian", "húngaro", "hungarian", "búlgaro", "bulgarian",
      "croata", "croatian", "serbio", "serbian", "esloveno", "slovenian", "eslovaco", "slovak",
      "ucraniano", "ukrainian", "bielorruso", "belarusian", "hebreo", "hebrew", "tailandés", "thai",
      "vietnamita", "vietnamese", "indonesio", "indonesian", "malayo", "malay", "filipino", "tagalog"
    ];
    
    if (knownLanguages.some(lang => topicLower.includes(lang))) {
      return true;
    }
    
    const languageKeywords = [
      "idioma", "language", "lengua", "vocabulario", "vocabulary",
      "gramática", "grammar", "aprender", "learn", "estudiar", "study"
    ];
    
    if (languageKeywords.some(keyword => topicLower.includes(keyword))) {
      const programmingKeywords = ["python", "javascript", "java", "sql", "c++", "c#", "programación", "programming", "código", "code"];
      if (!programmingKeywords.some(keyword => topicLower.includes(keyword))) {
        return true;
      }
    }
    
    return false;
  };
  const [words, setWords] = useState<Array<{ 
    word: string; 
    translation: string; 
    example?: string;
    romanization?: string;
    options?: string[];
  }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [failedWords, setFailedWords] = useState<Array<{ 
    word: string; 
    translation: string; 
    example?: string;
    romanization?: string;
    options?: string[];
  }>>([]);
  const [learnedWords, setLearnedWords] = useState<Array<{ 
    word: string; 
    translation: string; 
    example?: string;
    romanization?: string;
    options?: string[];
  }>>([]);
  const [showLearnedWords, setShowLearnedWords] = useState(false);
  const [isShowingFailedWords, setIsShowingFailedWords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [learnedWordsList, setLearnedWordsList] = useState<Array<{ 
    word: string; 
    translation: string; 
    example?: string;
    romanization?: string;
  }>>([]);
  const [checkedWord, setCheckedWord] = useState<{ 
    word: string; 
    translation: string; 
    example?: string;
    romanization?: string;
    options?: string[];
  } | null>(null);

  const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
  const bgColor = colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "#ffffff";
  const borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";

  // Cargar palabras aprendidas al montar el componente
  useEffect(() => {
    const loadLearnedWords = async () => {
      if (!userId || !language) return;
      
      try {
        const response = await fetch("/api/study-agents/get-learned-words", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, language }),
        });
        
        const data = await response.json();
        if (data.success) {
          setLearnedWordsList(data.words || []);
        }
      } catch (error) {
        console.error("Error loading learned words for flashcards:", error);
      }
    };

    loadLearnedWords();
  }, [userId, language]);

  // Cargar palabras iniciales cuando cambia el idioma, nivel o cuando se monta el componente
  useEffect(() => {
    if (apiKey && language) {
      // Limpiar palabras anteriores cuando cambia el tema
      setWords([]);
      setCurrentIndex(0);
      // Cargar nuevas palabras
      loadWords(10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, level, apiKey]);

  const loadWords = async (count: number = 10) => {
    if (!apiKey) return;
    
    setIsLoading(true);
    
    // Detectar si es un idioma o un tema general
    const isLanguage = isLanguageTopic(language);
    try {
      // Determinar el nombre del idioma en su idioma nativo
      const languageNames: Record<string, string> = {
        "inglés": "English",
        "english": "English",
        "francés": "Français",
        "francais": "Français",
        "alemán": "Deutsch",
        "deutsch": "Deutsch",
        "italiano": "Italiano",
        "portugués": "Português",
        "chino": "中文",
        "chino simplificado": "中文",
        "japonés": "日本語",
        "japones": "日本語",
        "coreano": "한국어",
        "catalán": "Català",
        "catalan": "Català",
        "ruso": "Русский",
      };

      let question: string;
      
      if (isLanguage) {
        // Prompt para idiomas
        const langKey = language.toLowerCase();
        const nativeName = languageNames[langKey] || language;
        const needsRomanization = langKey.includes("japonés") || langKey.includes("japones") ||
                                  langKey.includes("chino") || langKey.includes("coreano") ||
                                  langKey.includes("ruso") || langKey.includes("árabe");
        
        question = `Genera ${count} palabras o frases comunes en ${nativeName} (${language}) para nivel ${level}/10. 
IMPORTANTE: 
- Usa caracteres nativos del idioma (hiragana/katakana/kanji para japonés, hanzi para chino, hangul para coreano, etc.)
${needsRomanization ? `- Incluye la romanización (pronunciación en letras latinas) en el campo "romanization"` : ""}
- Para nivel 0-3: palabras básicas y comunes
- Para nivel 4-6: palabras intermedias
- Para nivel 7-10: palabras avanzadas y frases complejas
- El campo "example" debe ser SOLO en el idioma objetivo, sin traducción

🚨 REGLAS CRÍTICAS PARA OPCIONES MÚLTIPLES:
1. **UNA ÚNICA RESPUESTA CORRECTA**: DEBE haber exactamente UNA traducción correcta y clara. NO puede haber ambigüedad.
2. **OPCIONES NO AMBIGUAS**: Las 4 opciones deben ser claramente diferentes entre sí. NO uses sinónimos cercanos que puedan confundirse con la traducción correcta.
3. **OPCIONES INCORRECTAS CLARAMENTE DISTINTAS**: Las 3 opciones incorrectas deben ser:
   - Palabras de temas completamente diferentes (ej: si la palabra es "apple" (manzana), NO uses "pera" o "naranja", usa palabras de otros temas como "casa", "libro", "agua")
   - O palabras que suenen similar pero signifiquen algo completamente diferente
   - NUNCA uses palabras que puedan ser traducciones alternativas válidas
4. **VERIFICACIÓN OBLIGATORIA**: ANTES de generar las opciones, VERIFICA que:
   - Solo UNA opción es la traducción correcta
   - Las otras 3 opciones son claramente incorrectas y no pueden confundirse
   - No hay ambigüedad sobre cuál es la respuesta correcta

Genera 4 opciones de respuesta en este orden:
- La PRIMERA opción DEBE ser SIEMPRE la traducción correcta (la misma que el campo "translation")
- Las otras 3 opciones deben ser traducciones de palabras completamente diferentes del mismo idioma

Responde SOLO con un JSON array válido en este formato exacto (sin texto adicional):
[{"word": "palabra_o_frase_en_idioma_objetivo", "translation": "traducción_al_español", "example": "ejemplo_solo_en_idioma_objetivo_sin_traducción"${needsRomanization ? ', "romanization": "pronunciacion_en_letras_latinas"' : ""}, "options": ["traducción_correcta", "traducción_de_palabra_diferente_1", "traducción_de_palabra_diferente_2", "traducción_de_palabra_diferente_3"]}]`;
      } else {
        // Prompt para temas generales (como morse, matemáticas, etc.)
        question = `Genera ${count} conceptos, términos o preguntas sobre "${language}" para nivel ${level}/10 en formato de flashcards.

IMPORTANTE:
- Para nivel 0-3: conceptos básicos y fundamentales
- Para nivel 4-6: conceptos intermedios
- Para nivel 7-10: conceptos avanzados y especializados
- El campo "word" debe contener el concepto, término o pregunta
- El campo "translation" debe contener la definición, explicación o respuesta
- El campo "example" debe contener un ejemplo práctico o uso del concepto (opcional)

🚨 REGLAS CRÍTICAS PARA OPCIONES MÚLTIPLES:
1. **UNA ÚNICA RESPUESTA CORRECTA**: DEBE haber exactamente UNA definición/explicación correcta. NO puede haber ambigüedad.
2. **OPCIONES NO AMBIGUAS**: Las 4 opciones deben ser claramente diferentes entre sí. NO uses definiciones similares que puedan confundirse con la correcta.
3. **OPCIONES INCORRECTAS CLARAMENTE DISTINTAS**: Las 3 opciones incorrectas deben ser:
   - Definiciones de conceptos completamente diferentes (ej: si el concepto es "variable", NO uses "constante" o "parámetro", usa definiciones de conceptos diferentes como "función", "clase", "objeto")
   - O definiciones que suenen similares pero sean de conceptos diferentes
   - NUNCA uses definiciones que puedan ser correctas para el concepto
4. **VERIFICACIÓN OBLIGATORIA**: ANTES de generar las opciones, VERIFICA que:
   - Solo UNA opción es la definición/explicación correcta
   - Las otras 3 opciones son claramente incorrectas y no pueden confundirse
   - No hay ambigüedad sobre cuál es la respuesta correcta

Genera 4 opciones de respuesta en este orden:
- La PRIMERA opción DEBE ser SIEMPRE la definición/explicación correcta (la misma que el campo "translation")
- Las otras 3 opciones deben ser definiciones/explicaciones de conceptos completamente diferentes

Responde SOLO con un JSON array válido en este formato exacto (sin texto adicional):
[{"word": "concepto_o_término", "translation": "definición_o_explicación", "example": "ejemplo_práctico_opcional", "options": ["definición_correcta", "definición_de_concepto_diferente_1", "definición_de_concepto_diferente_2", "definición_de_concepto_diferente_3"]}]`;
      }
      
      const response = await fetch("/api/study-agents/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          question,
          userId: "flashcards",
          chatId: "flashcards",
          topic: language,
        }),
      });

      const data = await response.json();
      if (data.success) {
        try {
          // Extraer JSON de la respuesta
          const jsonMatch = data.answer.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            interface WordItem {
              word?: string;
              translation?: string;
              example?: string;
              romanization?: string;
              options?: string[];
            }
            const newWords: WordItem[] = JSON.parse(jsonMatch[0]);
            
            // Filtrar palabras que ya están en la lista de palabras aprendidas
            // También filtrar palabras que ya están en el array actual de words
            const learnedWordsSet = new Set(learnedWordsList.map(w => w.word.toLowerCase().trim()));
            const existingWordsSet = new Set(words.map(w => w.word?.toLowerCase().trim() || ""));
            
            const filteredWords = newWords.filter((word: WordItem) => {
              const wordLower = word.word?.toLowerCase().trim() || "";
              // Excluir si ya está aprendida O si ya está en la lista actual
              return !learnedWordsSet.has(wordLower) && !existingWordsSet.has(wordLower);
            });
            
            if (filteredWords.length === 0) {
              console.log("Todas las palabras generadas ya están aprendidas o ya están en la lista. Generando más...");
              // Si todas las palabras ya están aprendidas, intentar generar más
              // Pero evitar recursión infinita limitando el número de intentos
              if (count < 50) {
                // Pequeño delay para evitar demasiadas peticiones
                await new Promise(resolve => setTimeout(resolve, 500));
                await loadWords(count + 10);
                return;
              } else {
                console.warn("No se pudieron generar palabras nuevas después de varios intentos. Puede que ya hayas aprendido muchas palabras de este nivel.");
              }
            }
            
            // Validar y preparar las opciones para cada palabra
            const normalizeOption = (text: string) => {
              return text?.toLowerCase().trim().replace(/[.,;:!?()]/g, '') || "";
            };
            
            const wordsWithShuffledOptions = filteredWords.map((word: WordItem) => {
              if (word.options && word.options.length > 0) {
                // Normalizar todas las opciones para comparación
                const correctTranslation = word.translation || "";
                const correctNormalized = normalizeOption(correctTranslation);
                
                // Filtrar opciones duplicadas (normalizadas)
                const uniqueOptions: string[] = [];
                const seenNormalized = new Set<string>();
                
                for (const opt of word.options) {
                  const optNormalized = normalizeOption(opt);
                  if (!seenNormalized.has(optNormalized) && opt && opt.trim()) {
                    uniqueOptions.push(opt);
                    seenNormalized.add(optNormalized);
                  }
                }
                
                // Asegurarse de que la traducción correcta esté en las opciones
                const hasCorrect = uniqueOptions.some(opt => normalizeOption(opt) === correctNormalized);
                if (!hasCorrect && correctTranslation) {
                  // Si la traducción correcta no está, añadirla al principio
                  uniqueOptions.unshift(correctTranslation);
                }
                
                // Asegurarse de que hay exactamente 4 opciones únicas
                if (uniqueOptions.length < 4) {
                  // Si faltan opciones, añadir opciones genéricas pero diferentes
                  const genericOptions = ["Opción A", "Opción B", "Opción C"];
                  let genericIndex = 0;
                  while (uniqueOptions.length < 4 && genericIndex < genericOptions.length) {
                    const generic = genericOptions[genericIndex];
                    if (!uniqueOptions.some(opt => normalizeOption(opt) === normalizeOption(generic))) {
                      uniqueOptions.push(generic);
                    }
                    genericIndex++;
                  }
                  // Si aún faltan, duplicar la última (no ideal, pero necesario)
                  while (uniqueOptions.length < 4) {
                    uniqueOptions.push(`Opción ${uniqueOptions.length + 1}`);
                  }
                } else if (uniqueOptions.length > 4) {
                  // Si hay más de 4, asegurarse de que la correcta esté y tomar 3 incorrectas únicas
                  const correctIndex = uniqueOptions.findIndex(opt => normalizeOption(opt) === correctNormalized);
                  if (correctIndex >= 0) {
                    // Tomar la correcta y 3 incorrectas diferentes
                    const incorrect = uniqueOptions.filter((opt, idx) => 
                      idx !== correctIndex && normalizeOption(opt) !== correctNormalized
                    ).slice(0, 3);
                    uniqueOptions.length = 0;
                    uniqueOptions.push(correctTranslation, ...incorrect);
                  } else {
                    // Si no se encontró la correcta, tomar las primeras 4
                    uniqueOptions.length = 4;
                  }
                }
                
                // Mezclar las opciones aleatoriamente
                const shuffled = [...uniqueOptions].sort(() => Math.random() - 0.5);
                
                return { ...word, options: shuffled };
              } else {
                // Si no hay opciones, crear opciones básicas
                const correctTranslation = word.translation || "";
                return {
                  ...word,
                  options: [
                    correctTranslation,
                    "Opción 2",
                    "Opción 3",
                    "Opción 4"
                  ]
                };
              }
            });
            setWords(prev => [...prev, ...wordsWithShuffledOptions] as typeof prev);
          }
        } catch (e) {
          console.error("Error parsing words:", e);
        }
      }
    } catch (error) {
      console.error("Error loading words:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar palabras aprendidas del array de words antes de mostrar
  const filteredWords = useMemo(() => {
    if (learnedWordsList.length === 0) return words;
    
    const learnedWordsSet = new Set(learnedWordsList.map(w => w.word.toLowerCase().trim()));
    return words.filter(word => {
      const wordLower = word.word?.toLowerCase().trim() || "";
      return !learnedWordsSet.has(wordLower);
    });
  }, [words, learnedWordsList]);

  // Calcular la palabra actual de forma consistente (usando palabras filtradas)
  const currentWord = useMemo(() => {
    const displayWords = isShowingFailedWords ? failedWords : filteredWords;
    if (displayWords.length === 0) return null;
    const safeIndex = Math.min(currentIndex, displayWords.length - 1);
    return displayWords[safeIndex] || null;
  }, [isShowingFailedWords, failedWords, filteredWords, currentIndex]);

  const handleCheck = (selectedTranslation: string) => {
    // CRÍTICO: Capturar la palabra actual en el momento exacto del clic
    // para evitar que cambie durante la verificación
    const displayWords = isShowingFailedWords ? failedWords : filteredWords;
    if (displayWords.length === 0) return;
    const safeIndex = Math.min(currentIndex, displayWords.length - 1);
    const wordBeingChecked = displayWords[safeIndex];
    
    if (!wordBeingChecked) {
      console.error("[LanguageFlashcards] No se encontró la palabra en el índice:", safeIndex);
      return;
    }
    
    // Normalizar las traducciones para comparación (case-insensitive, sin espacios extra, sin acentos opcionales)
    const normalize = (text: string) => {
      return text?.toLowerCase().trim().replace(/[.,;:!?()]/g, '') || "";
    };
    
    const selectedNormalized = normalize(selectedTranslation);
    const correctTranslationNormalized = normalize(wordBeingChecked.translation);
    
    // También verificar si alguna de las opciones coincide exactamente con la traducción correcta
    let isAnswerCorrect = selectedNormalized === correctTranslationNormalized;
    
    // Si no coincide directamente, verificar si la opción seleccionada es igual a alguna opción que coincida con la correcta
    if (!isAnswerCorrect && wordBeingChecked.options) {
      // Buscar si alguna opción es la correcta
      const correctOption = wordBeingChecked.options.find((opt: string) => 
        normalize(opt) === correctTranslationNormalized
      );
      
      // Si encontramos la opción correcta, verificar si la seleccionada es esa
      if (correctOption) {
        isAnswerCorrect = normalize(selectedTranslation) === normalize(correctOption);
      }
    }
    
    console.log("[LanguageFlashcards] Verificando respuesta:", {
      palabra: wordBeingChecked.word,
      palabraIndex: safeIndex,
      seleccionada: selectedTranslation,
      seleccionadaNormalizada: selectedNormalized,
      correcta: wordBeingChecked.translation,
      correctaNormalizada: correctTranslationNormalized,
      esCorrecta: isAnswerCorrect,
      currentIndex,
      totalPalabras: displayWords.length,
      opciones: wordBeingChecked.options
    });

    // Guardar la palabra que se está verificando para mostrarla en la respuesta
    setCheckedWord(wordBeingChecked);
    setIsCorrect(isAnswerCorrect);
    setShowAnswer(true);
    setStats(prev => ({ 
      correct: prev.correct + (isAnswerCorrect ? 1 : 0), 
      total: prev.total + 1 
    }));

    if (isAnswerCorrect) {
      // Agregar a palabras aprendidas si no está ya (usar wordBeingChecked, no currentWord)
      if (!learnedWords.find(w => w.word === wordBeingChecked.word)) {
        setLearnedWords(prev => [...prev, wordBeingChecked]);
        
        // Actualizar también la lista local de palabras aprendidas para filtrar futuras palabras
        setLearnedWordsList(prev => {
          const wordLower = wordBeingChecked.word.toLowerCase().trim();
          if (!prev.find(w => w.word.toLowerCase().trim() === wordLower)) {
            return [...prev, {
              word: wordBeingChecked.word,
              translation: wordBeingChecked.translation,
              example: wordBeingChecked.example,
              romanization: wordBeingChecked.romanization,
            }];
          }
          return prev;
        });
        
        // Guardar en el backend
        if (userId && language) {
          fetch("/api/study-agents/add-learned-word", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              language,
              word: wordBeingChecked.word,
              translation: wordBeingChecked.translation,
              source: "flashcards",
              example: wordBeingChecked.example,
              romanization: wordBeingChecked.romanization,
            }),
          })
          .then(async (res) => {
            const data = await res.json();
            if (data.success) {
              // Recargar el conteo desde el backend para asegurar sincronización
              fetch("/api/study-agents/get-learned-words-count", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, language }),
              })
              .then(async (countRes) => {
                const countData = await countRes.json();
                if (countData.success && setLearnedWordsCount) {
                  setLearnedWordsCount(countData.count || 0);
                }
              })
              .catch(err => console.error("Error loading words count:", err));
              
              // Recargar la lista completa de palabras aprendidas para asegurar que se filtren correctamente
              fetch("/api/study-agents/get-learned-words", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, language }),
              })
              .then(async (wordsRes) => {
                const wordsData = await wordsRes.json();
                if (wordsData.success) {
                  setLearnedWordsList(wordsData.words || []);
                }
              })
              .catch(err => console.error("Error reloading learned words:", err));
              
              // Si hay actualización de nivel, actualizar el nivel del chat
              if (data.level_update && currentChatLevel && setCurrentChatLevel && currentChatLevel.topic === language) {
                const levelData = data.level_update;
                interface LevelUpdate {
                  new_level?: number;
                  level?: number;
                }
                const newLevel = (levelData as LevelUpdate)?.new_level || (levelData as LevelUpdate)?.level;
                if (newLevel !== undefined) {
                  const oldLevel = currentChatLevel.level;
                  setCurrentChatLevel({
                    topic: language,
                    level: newLevel,
                  });
                  
                  // Mostrar mensaje si subió de nivel
                  if (newLevel > oldLevel) {
                    console.log(`📊 Nivel actualizado: ${oldLevel} → ${newLevel}`);
                  }
                }
              }
            }
          })
          .catch(err => console.error("Error saving learned word:", err));
        }
      }
      // Remover de palabras fallidas si estaba ahí (usar wordBeingChecked)
      setFailedWords(prev => {
        const filtered = prev.filter(w => w.word !== wordBeingChecked.word);
        // Si estamos mostrando palabras fallidas y acabamos de eliminar la palabra actual, ajustar el índice
        if (isShowingFailedWords) {
          if (filtered.length === 0) {
            // Si no quedan palabras fallidas, volver a palabras normales
            setIsShowingFailedWords(false);
            setCurrentIndex(0);
          } else {
            const safeIndex = Math.min(currentIndex, filtered.length - 1);
            if (safeIndex >= filtered.length) {
              // Ajustar el índice si está fuera de rango
              setCurrentIndex(Math.min(safeIndex, filtered.length - 1));
            }
          }
        }
        return filtered;
      });
    } else {
      // Agregar a palabras fallidas si no está ya (usar wordBeingChecked)
      if (!failedWords.find(w => w.word === wordBeingChecked.word)) {
        setFailedWords(prev => [...prev, wordBeingChecked]);
      }
    }
  };

  const handleRepeatFailedWords = () => {
    if (failedWords.length === 0) return;
    // Mezclar las palabras fallidas para practicarlas de nuevo
    const shuffled = [...failedWords].sort(() => Math.random() - 0.5);
    setFailedWords(shuffled);
    setIsShowingFailedWords(true);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setIsCorrect(null);
    setCheckedWord(null); // Limpiar la palabra verificada
  };

  const handleNext = () => {
    if (isShowingFailedWords) {
      // Si estamos mostrando palabras fallidas, avanzar índice
      if (currentIndex >= failedWords.length - 1) {
        // Si terminamos todas las fallidas, volver a palabras normales
        setIsShowingFailedWords(false);
        setCurrentIndex(0);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      // Avanzar en palabras normales (usar filteredWords para excluir aprendidas)
      if (currentIndex >= filteredWords.length - 1) {
        // Si terminamos todas las palabras filtradas, cargar más
        loadWords(10);
        setCurrentIndex(0);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }
    
    setSelectedOption(null);
    setShowAnswer(false);
    setIsCorrect(null);
    setCheckedWord(null); // Limpiar la palabra verificada al avanzar

    // Cargar más palabras si nos quedamos sin (usar filteredWords)
    if (!isShowingFailedWords && currentIndex >= filteredWords.length - 3 && !isLoading && filteredWords.length > 0) {
      loadWords(10);
    }
  };


  if (!currentWord) {
    return (
      <div style={{
        padding: "2rem",
        background: bgColor,
        borderRadius: "12px",
        border: `1px solid ${borderColor}`,
        textAlign: "center",
        color: textColor,
        animation: "fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "2rem" }}>
            {/* Premium Loading Animation - Enhanced */}
            <div className="premium-loading-indicator-enhanced" style={{ marginBottom: "0.5rem" }}>
              <div className="loading-orb-container-enhanced">
                <div className="loading-orb-enhanced orb-1-enhanced"></div>
                <div className="loading-orb-enhanced orb-2-enhanced"></div>
                <div className="loading-orb-enhanced orb-3-enhanced"></div>
                <div className="loading-orb-enhanced orb-4-enhanced"></div>
              </div>
              <div className="loading-pulse-ring-enhanced ring-1"></div>
              <div className="loading-pulse-ring-enhanced ring-2"></div>
              <div className="loading-center-core"></div>
            </div>
            <div style={{ 
              fontSize: "1rem",
              fontWeight: 600,
              color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}>
              <span>Cargando palabras</span>
              <span className="loading-dots-enhanced">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
            {/* Premium Skeleton loader */}
            <div style={{
              width: "100%",
              maxWidth: "300px",
              marginTop: "1rem",
            }}>
              <div className="premium-skeleton-loader" style={{ height: "200px", marginBottom: "1rem", borderRadius: "12px" }}></div>
              <div className="premium-skeleton-loader" style={{ height: "16px", width: "80%", margin: "0 auto 0.5rem", borderRadius: "8px" }}></div>
              <div className="premium-skeleton-loader" style={{ height: "16px", width: "60%", margin: "0 auto", borderRadius: "8px" }}></div>
            </div>
          </div>
        ) : (
          "No hay palabras disponibles"
        )}
      </div>
    );
  }

  // Debug: verificar que el componente se renderiza
  console.log("[LanguageFlashcards] Renderizando con palabra:", currentWord.word, "idioma:", language);

  return (
    <div style={{
      padding: "2rem",
      background: bgColor,
      borderRadius: "12px",
      border: `1px solid ${borderColor}`,
      boxShadow: colorTheme === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
    }}>
      {/* Header con estadísticas */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        paddingBottom: "1rem",
        borderBottom: `1px solid ${borderColor}`,
      }}>
        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: textColor }}>
          Flashcards - {language}
        </h3>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={() => setShowLearnedWords(true)}
            disabled={learnedWords.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: learnedWords.length === 0 
                ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.05)")
                : "#10b981",
              color: learnedWords.length === 0 
                ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.5)" : "rgba(148, 163, 184, 0.7)")
                : "white",
              border: `1px solid ${learnedWords.length === 0 ? borderColor : "#10b981"}`,
              borderRadius: "16px",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: learnedWords.length === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: learnedWords.length === 0 ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (learnedWords.length > 0) {
                e.currentTarget.style.background = "#059669";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (learnedWords.length > 0) {
                e.currentTarget.style.background = "#10b981";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            <HiCheck size={16} />
            <span>{learnedWords.length}</span>
          </button>
          
          <button
            onClick={handleRepeatFailedWords}
            disabled={failedWords.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: failedWords.length === 0 
                ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.05)")
                : "#ef4444",
              color: failedWords.length === 0 
                ? (colorTheme === "dark" ? "rgba(148, 163, 184, 0.5)" : "rgba(148, 163, 184, 0.7)")
                : "white",
              border: `1px solid ${failedWords.length === 0 ? borderColor : "#ef4444"}`,
              borderRadius: "16px",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: failedWords.length === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: failedWords.length === 0 ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (failedWords.length > 0) {
                e.currentTarget.style.background = "#dc2626";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (failedWords.length > 0) {
                e.currentTarget.style.background = "#ef4444";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            <HiXMark size={16} />
            <span>{failedWords.length}</span>
          </button>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
            padding: "0.5rem 0.75rem",
          }}>
            <HiChartBar size={16} />
            <span>{stats.total}</span>
          </div>
        </div>
      </div>

      {/* Card de palabra */}
      <div 
        className={showAnswer && isCorrect ? "flashcard-flip" : ""}
        style={{
          background: colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "1.5rem",
          border: `2px solid ${isCorrect === true ? "#10b981" : isCorrect === false ? "#ef4444" : "transparent"}`,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          minHeight: "200px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          transform: showAnswer && isCorrect ? "scale(1.02)" : showAnswer && isCorrect === false ? "scale(0.98)" : "scale(1)",
          animation: showAnswer && isCorrect ? "flashcardSuccess 0.6s cubic-bezier(0.16, 1, 0.3, 1)" : showAnswer && isCorrect === false ? "flashcardError 0.5s ease-in-out" : "fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Botón de audio en esquina superior derecha */}
        {language && (
          <div style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
          }}>
            <AudioButton text={(checkedWord || currentWord).word} language={language} colorTheme={colorTheme} size={20} />
          </div>
        )}
        
        <div style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: textColor,
          textAlign: "center",
          marginBottom: "0.5rem",
        }}>
          {(checkedWord || currentWord).word}
        </div>
        
        {(checkedWord || currentWord).romanization && (
          <div style={{
            fontSize: "1rem",
            color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
            fontStyle: "italic",
            marginBottom: "1rem",
            textAlign: "center",
            opacity: 0.8,
          }}>
            {(checkedWord || currentWord).romanization}
          </div>
        )}
        
        {(checkedWord || currentWord).example && !showAnswer && (
          <div style={{
            fontSize: "0.875rem",
            color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
            fontStyle: "italic",
            marginBottom: "1rem",
            textAlign: "center",
          }}>
            {(checkedWord || currentWord).example}
          </div>
        )}

        {showAnswer && checkedWord && (() => {
          console.log("[LanguageFlashcards] Mostrando traducción de checkedWord:", checkedWord.translation, "para palabra:", checkedWord.word);
          return (
            <div style={{
              marginTop: "1rem",
              padding: "1rem",
              background: colorTheme === "dark" ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
              borderRadius: "8px",
              border: `1px solid ${colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)"}`,
            }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 500, color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b", marginBottom: "0.5rem" }}>
                Traducción correcta:
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "#10b981" }}>
                {checkedWord.translation}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Opciones múltiples */}
      {((!showAnswer && currentWord?.options) || (showAnswer && checkedWord?.options)) && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: textColor,
            marginBottom: "0.75rem",
          }}>
            {showAnswer ? "Respuesta:" : "Selecciona la traducción correcta:"}
          </div>
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}>
            {((showAnswer && checkedWord) ? (checkedWord.options || []) : (currentWord?.options || [])).map((option, index) => {
              const isSelected = selectedOption === option;
              // CRÍTICO: Cuando se muestra la respuesta, SIEMPRE usar checkedWord
              // Cuando no se muestra, usar currentWord
              const wordToCheck = showAnswer ? checkedWord : currentWord;
              if (!wordToCheck) return null;
              const correctTranslation = wordToCheck.translation || "";
              
              // Normalizar para comparación (case-insensitive, sin espacios extra, sin puntuación)
              const normalize = (text: string) => {
                return text?.toLowerCase().trim().replace(/[.,;:!?()]/g, '') || "";
              };
              
              const optionNormalized = normalize(option);
              const correctNormalized = normalize(correctTranslation);
              const isCorrectOption = optionNormalized === correctNormalized;
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (!showAnswer) {
                      setSelectedOption(option);
                      // Verificar automáticamente al seleccionar
                      setTimeout(() => {
                        handleCheck(option);
                      }, 100);
                    }
                  }}
                  disabled={showAnswer}
                  style={{
                    flex: "1 1 calc(25% - 0.75rem)",
                    minWidth: "150px",
                    padding: "1rem 1.25rem",
                    background: showAnswer
                      ? (isCorrectOption 
                          ? (colorTheme === "dark" ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.15)")
                          : (isSelected && !isCorrectOption
                              ? (colorTheme === "dark" ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.15)")
                              : (colorTheme === "dark" ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.05)")))
                      : (isSelected
                          ? (colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.15)")
                          : (colorTheme === "dark" ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.05)")),
                    border: showAnswer
                      ? (isCorrectOption
                          ? `2px solid #10b981`
                          : (isSelected && !isCorrectOption
                              ? `2px solid #ef4444`
                              : `1px solid ${borderColor}`))
                      : (isSelected
                          ? `2px solid #6366f1`
                          : `1px solid ${borderColor}`),
                    borderRadius: "16px",
                    color: textColor,
                    fontSize: "1rem",
                    fontWeight: isSelected ? 600 : 500,
                    cursor: showAnswer ? "default" : "pointer",
                    textAlign: "center",
                    transition: "background-color 0.2s ease, border-color 0.2s ease",
                    fontFamily: outfit.style.fontFamily,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: showAnswer
                        ? (isCorrectOption ? "#10b981" : (isSelected && !isCorrectOption ? "#ef4444" : "transparent"))
                        : (isSelected ? "#6366f1" : "transparent"),
                      border: showAnswer
                        ? (isCorrectOption ? "2px solid #10b981" : (isSelected && !isCorrectOption ? "2px solid #ef4444" : `2px solid ${borderColor}`))
                        : (isSelected ? "2px solid #6366f1" : `2px solid ${borderColor}`),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {showAnswer && isCorrectOption && (
                        <span style={{ color: "white", fontSize: "0.75rem", fontWeight: 700 }}>✓</span>
                      )}
                      {showAnswer && isSelected && !isCorrectOption && (
                        <span style={{ color: "white", fontSize: "0.75rem", fontWeight: 700 }}>✗</span>
                      )}
                      {!showAnswer && isSelected && (
                        <div style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "white",
                        }} />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showAnswer && (
        <button
          onClick={handleNext}
          style={{
            width: "100%",
            padding: "0.875rem 1.5rem",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "16px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "1rem",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#4f46e5";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#6366f1";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Siguiente palabra
        </button>
      )}

      {/* Modal de palabras aprendidas */}
      {showLearnedWords && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "2rem",
          }}
          onClick={() => setShowLearnedWords(false)}
        >
          <div
            style={{
              background: bgColor,
              borderRadius: "20px",
              padding: "2.5rem",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              border: `1px solid ${borderColor}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}>
              <h2 style={{
                margin: 0,
                fontSize: "1.75rem",
                fontWeight: 700,
                color: textColor,
              }}>
                Palabras aprendidas ({learnedWords.length})
              </h2>
              <button
                onClick={() => setShowLearnedWords(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  color: textColor,
                  cursor: "pointer",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colorTheme === "dark" 
                    ? "rgba(148, 163, 184, 0.1)" 
                    : "rgba(148, 163, 184, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                ✕
              </button>
            </div>

            {learnedWords.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "3rem",
                color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
                <div style={{ fontSize: "1.125rem" }}>
                  Aún no has aprendido ninguna palabra.
                  <br />
                  ¡Sigue practicando!
                </div>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.25rem",
              }}>
                {learnedWords.map((word, index) => (
                  <div
                    key={index}
                    style={{
                      background: colorTheme === "dark" 
                        ? "rgba(16, 185, 129, 0.1)" 
                        : "rgba(16, 185, 129, 0.08)",
                      border: `2px solid ${colorTheme === "dark" 
                        ? "rgba(16, 185, 129, 0.3)" 
                        : "rgba(16, 185, 129, 0.4)"}`,
                      borderRadius: "16px",
                      padding: "1.5rem",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = colorTheme === "dark"
                        ? "0 8px 16px rgba(16, 185, 129, 0.2)"
                        : "0 8px 16px rgba(16, 185, 129, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: textColor,
                      marginBottom: "0.5rem",
                      textAlign: "center",
                    }}>
                      {word.word}
                    </div>
                    
                    {word.romanization && (
                      <div style={{
                        fontSize: "0.875rem",
                        color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                        fontStyle: "italic",
                        marginBottom: "0.75rem",
                        textAlign: "center",
                        opacity: 0.8,
                      }}>
                        {word.romanization}
                      </div>
                    )}

                    <div style={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      color: "#10b981",
                      marginBottom: "0.5rem",
                      textAlign: "center",
                    }}>
                      {word.translation}
                    </div>

                    {word.example && (
                      <div style={{
                        fontSize: "0.875rem",
                        color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                        fontStyle: "italic",
                        marginTop: "0.75rem",
                        paddingTop: "0.75rem",
                        borderTop: `1px solid ${colorTheme === "dark" 
                          ? "rgba(148, 163, 184, 0.2)" 
                          : "rgba(148, 163, 184, 0.3)"}`,
                        textAlign: "center",
                      }}>
                        {word.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de intérprete de código para lenguajes de programación
function CodeInterpreter({
  language,
  colorTheme = "dark",
  initialCode = "",
  onCodeChange,
}: {
  language: string;
  colorTheme?: "dark" | "light";
  initialCode?: string;
  onCodeChange?: (code: string) => void;
}) {
  const [code, setCode] = useState(initialCode || "");
  const [inputs, setInputs] = useState(""); // Inputs para programas que usan input()
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  
  // Sincronizar código inicial cuando cambia initialCode
  useEffect(() => {
    if (initialCode !== undefined && initialCode !== code) {
      setCode(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);
  
  // Notificar cambios de código (usar useRef para evitar bucles)
  const prevCodeRef = useRef(code);
  useEffect(() => {
    if (onCodeChange && code !== prevCodeRef.current) {
      prevCodeRef.current = code;
      onCodeChange(code);
    }
  }, [code, onCodeChange]);

  const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
  const bgColor = colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "#ffffff";
  const borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";
  const codeBgColor = colorTheme === "dark" ? "#1e1e1e" : "#f8f9fa";

  // Templates de código según el lenguaje
  const codeTemplates: Record<string, string> = {
    python: `# Escribe tu código Python aquí
# Para usar input(), escribe los valores en el campo "Inputs" (uno por línea)

nombre = input("Ingrese su nombre: ")
edad = input("Ingrese su edad: ")
print(f"¡Hola, {nombre}! Tienes {edad} años.")`,
    javascript: `// Escribe tu código JavaScript aquí
console.log("¡Hola, mundo!");

// Ejemplo:
function saludar(nombre) {
    return \`¡Hola, \${nombre}!\`;
}

const resultado = saludar("Estudiante");
console.log(resultado);`,
    java: `// Escribe tu código Java aquí
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Ingrese su nombre: ");
        String nombre = scanner.nextLine();
        System.out.println("¡Hola, " + nombre + "!");
    }
}`,
    sql: `-- Escribe tu consulta SQL aquí
-- Ejemplo:
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY,
    nombre TEXT,
    email TEXT
);

INSERT INTO usuarios (nombre, email) VALUES 
('Juan', 'juan@example.com'),
('María', 'maria@example.com');

SELECT * FROM usuarios;`,
    cpp: `// Escribe tu código C++ aquí
#include <iostream>
#include <string>
using namespace std;

int main() {
    string nombre;
    cout << "Ingrese su nombre: ";
    getline(cin, nombre);
    cout << "¡Hola, " << nombre << "!" << endl;
    return 0;
}`,
    html: `<!DOCTYPE html>
<html>
<head>
    <title>Mi Página</title>
</head>
<body>
    <h1>¡Hola, mundo!</h1>
    <p>Esta es una página HTML de ejemplo.</p>
</body>
</html>`,
    react: `import React, { useState } from 'react';

function App() {
    const [nombre, setNombre] = useState('');
    
    return (
        <div>
            <input 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                placeholder="Ingrese su nombre"
            />
            <p>¡Hola, {nombre || 'mundo'}!</p>
        </div>
    );
}

export default App;`,
  };

  useEffect(() => {
    const langLower = language.toLowerCase();
    if (langLower.includes("python")) {
      setCode(codeTemplates.python);
    } else if (langLower.includes("javascript") || langLower.includes("js")) {
      setCode(codeTemplates.javascript);
    } else if (langLower.includes("java")) {
      setCode(codeTemplates.java);
    } else if (langLower.includes("sql")) {
      setCode(codeTemplates.sql);
    } else if (langLower.includes("c++") || langLower.includes("cpp") || langLower.includes("cplusplus")) {
      setCode(codeTemplates.cpp);
    } else if (langLower.includes("html")) {
      setCode(codeTemplates.html);
    } else if (langLower.includes("react")) {
      setCode(codeTemplates.react);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");

    try {
      const langLower = language.toLowerCase();
      
      // Determinar el nombre del lenguaje para la API
      let languageName = language;
      if (langLower.includes("javascript") || langLower.includes("js")) {
        languageName = "javascript";
      } else if (langLower.includes("python")) {
        languageName = "python";
      } else if (langLower.includes("java")) {
        languageName = "java";
      } else if (langLower.includes("sql")) {
        languageName = "sql";
      } else if (langLower.includes("c++") || langLower.includes("cpp") || langLower.includes("cplusplus")) {
        languageName = "c++";
      } else if (langLower.includes("html")) {
        languageName = "html";
      } else if (langLower.includes("react")) {
        languageName = "react";
      }
      
      // Para JavaScript, ejecutar directamente en el navegador (solo si no hay inputs)
      if ((langLower.includes("javascript") || langLower.includes("js")) && !inputs) {
        try {
          const logs: string[] = [];
          const originalLog = console.log;
          console.log = (...args: unknown[]) => {
            logs.push(args.map(arg => 
              typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(" "));
            originalLog(...args);
          };

          // Ejecutar código en un contexto aislado
          const func = new Function(code);
          func();
          
          console.log = originalLog;
          setOutput(logs.join("\n") || "Código ejecutado sin errores.");
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : "Error al ejecutar el código";
          setError(errorMessage);
        }
      } else {
        // Para todos los lenguajes (incluyendo JavaScript con inputs), usar la API del servidor
        try {
          const response = await fetch("/api/study-agents/execute-code", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: code,
              language: languageName,
              inputs: inputs || undefined, // Enviar inputs solo si hay
            }),
          });

          if (!response.ok) {
            // Si la respuesta no es OK, intentar leer el error
            interface ErrorResponse {
              error?: string;
              detail?: string;
            }
            let errorData: ErrorResponse;
            try {
              errorData = await response.json() as ErrorResponse;
            } catch {
              const text = await response.text();
              throw new Error(text || `Error del servidor (${response.status})`);
            }
            throw new Error(errorData.error || errorData.detail || `Error al ejecutar código (${response.status})`);
          }

          const data = await response.json();
          
          if (data.success) {
            setOutput(data.output || "Código ejecutado sin errores.");
            setError("");
          } else {
            setError(data.error || "Error al ejecutar el código");
            setOutput(data.output || "");
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : "Error al comunicarse con el servidor";
          // Si es un error de conexión, dar un mensaje más útil
          if (errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch") || errorMessage.includes("Not Found")) {
            setError("No se pudo conectar con el servidor de ejecución. Asegúrate de que el backend FastAPI esté corriendo en http://localhost:8000");
          } else {
            setError(errorMessage);
          }
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setOutput("");
    setError("");
  };

  const handleReset = () => {
    const langLower = language.toLowerCase();
    if (langLower.includes("python")) {
      setCode(codeTemplates.python);
    } else if (langLower.includes("javascript") || langLower.includes("js")) {
      setCode(codeTemplates.javascript);
    } else if (langLower.includes("java")) {
      setCode(codeTemplates.java);
    } else if (langLower.includes("sql")) {
      setCode(codeTemplates.sql);
    } else if (langLower.includes("c++") || langLower.includes("cpp") || langLower.includes("cplusplus")) {
      setCode(codeTemplates.cpp);
    } else if (langLower.includes("html")) {
      setCode(codeTemplates.html);
    } else if (langLower.includes("react")) {
      setCode(codeTemplates.react);
    }
    setInputs("");
    setOutput("");
    setError("");
  };

  return (
    <div style={{
      padding: "1.5rem",
      background: bgColor,
      borderRadius: "12px",
      border: `1px solid ${borderColor}`,
      boxShadow: colorTheme === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
      }}>
        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: textColor }}>
          Intérprete de {language}
        </h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleRun}
            disabled={isRunning}
            style={{
              padding: "0.5rem 1rem",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: isRunning ? "not-allowed" : "pointer",
              opacity: isRunning ? 0.6 : 1,
            }}
          >
            {isRunning ? "Ejecutando..." : "▶ Ejecutar"}
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: "0.5rem 1rem",
              background: "transparent",
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Limpiar
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: "0.5rem 1rem",
              background: "transparent",
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Editor de código con syntax highlighting */}
      <div style={{ marginBottom: "1rem", border: `1px solid ${borderColor}`, borderRadius: "8px", overflow: "hidden" }}>
        <CodeMirror
          value={code}
          onChange={(value) => setCode(value)}
          height="300px"
          theme={(() => {
            if (colorTheme === "dark") {
              return oneDark;
            }
            const isDark = false; // En este bloque sabemos que es "light"
            return EditorView.theme({
              "&": {
                backgroundColor: codeBgColor,
                color: textColor,
              },
              ".cm-content": {
                caretColor: textColor,
              },
              ".cm-editor": {
                backgroundColor: codeBgColor,
              },
              ".cm-gutters": {
                backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                color: isDark ? "#858585" : "#6e7681",
                border: "none",
              },
            ".cm-lineNumbers .cm-gutterElement": {
              color: isDark ? "#858585" : "#6e7681",
            },
            ".cm-activeLineGutter": {
              backgroundColor: isDark ? "#2a2a2a" : "#e8e8e8",
            },
            ".cm-activeLine": {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
            },
            ".cm-selectionMatch": {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            },
          });
          })()}
          extensions={[
            language.toLowerCase().includes("python") ? python() :
            language.toLowerCase().includes("javascript") || language.toLowerCase().includes("js") ? javascript({ jsx: true }) :
            language.toLowerCase().includes("java") ? java() :
            language.toLowerCase().includes("sql") ? sql() :
            language.toLowerCase().includes("c++") || language.toLowerCase().includes("cpp") || language.toLowerCase().includes("cplusplus") ? cpp() :
            []
          ]}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: true,
          }}
          style={{
            fontSize: "0.875rem",
            fontFamily: jetbrainsMono.style.fontFamily,
          }}
        />
      </div>

      {/* Inputs para programas que usan input() */}
      {(language.toLowerCase().includes("python") || 
        language.toLowerCase().includes("java") || 
        language.toLowerCase().includes("c++") || 
        language.toLowerCase().includes("cpp")) && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: textColor,
            marginBottom: "0.5rem",
          }}>
            Inputs (uno por línea, para programas que usan input() o Scanner):
          </label>
          <textarea
            value={inputs}
            onChange={(e) => setInputs(e.target.value)}
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "0.75rem",
              background: codeBgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: "8px",
              color: textColor,
              fontFamily: jetbrainsMono.style.fontFamily,
              fontSize: "0.875rem",
              lineHeight: 1.6,
              resize: "vertical",
            }}
            placeholder="Ejemplo para Python:&#10;Juan&#10;25"
          />
        </div>
      )}

      {/* Output */}
      {(output || error) && (
        <div style={{
          padding: "1rem",
          background: error 
            ? (colorTheme === "dark" ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.08)")
            : (colorTheme === "dark" ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)"),
          borderRadius: "8px",
          border: `1px solid ${error 
            ? (colorTheme === "dark" ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.4)")
            : (colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)")}`,
        }}>
          <div style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: error ? "#ef4444" : "#10b981",
            marginBottom: "0.5rem",
          }}>
            {error ? "Error:" : "Salida:"}
          </div>
          <pre style={{
            margin: 0,
            color: textColor,
            fontFamily: jetbrainsMono.style.fontFamily,
            fontSize: "0.875rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {error || output}
          </pre>
        </div>
      )}
    </div>
  );
}

