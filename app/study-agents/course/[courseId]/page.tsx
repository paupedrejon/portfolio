"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import katex from "katex";
import "katex/dist/katex.min.css";
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
  summaries?: Record<string, { summary?: string | null; subtopics?: Record<string, string> } | string>;
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
  
  // Función para convertir URLs relativas de imágenes a absolutas
  const fixImageUrls = (content: string): string => {
    if (!content) return "";
    // Convertir URLs relativas /api/files/ a absolutas con localhost:8000
    const apiBaseUrl = typeof window !== 'undefined' 
      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8000'
        : window.location.origin.replace(':3000', ':8000')
      : 'http://localhost:8000';
    
    // Primero corregir URLs
    let fixed = content.replace(
      /src=["'](\/api\/files\/[^"']+)["']/g,
      (match, url) => `src="${apiBaseUrl}${url}"`
    );
    
    // Añadir crossOrigin="anonymous" a todas las imágenes que no lo tengan
    fixed = fixed.replace(
      /<img([^>]*?)(?:\s+crossOrigin=["'][^"']*["'])?([^>]*?)>/gi,
      (match, before, after) => {
        if (!match.includes('crossOrigin')) {
          return `<img${before} crossOrigin="anonymous"${after}>`;
        }
        return match;
      }
    );
    
    return fixed;
  };
  
  // Función para procesar fórmulas matemáticas LaTeX ($...$) usando KaTeX
  const processMathFormulas = (content: string): string => {
    if (!content) return "";
    let processed = content;
    
    // Primero procesar bloques de matemáticas $$...$$ (más específico primero)
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
    
    // Reemplazar placeholders de bloques con HTML renderizado por KaTeX
    blockPlaceholders.forEach((formula, index) => {
      try {
        const rendered = katex.renderToString(formula, {
          displayMode: true,
          throwOnError: false,
        });
        processed = processed.replace(
          `__MATH_BLOCK_${index}__`,
          `<div style="text-align: center; margin: 1.5rem 0; padding: 1rem; background: rgba(99, 102, 241, 0.1); border-radius: 8px; overflow-x: auto;">${rendered}</div>`
        );
      } catch (e) {
        // Si KaTeX falla, mostrar la fórmula como texto
        processed = processed.replace(
          `__MATH_BLOCK_${index}__`,
          `<div style="text-align: center; margin: 1.5rem 0; padding: 1rem; background: rgba(99, 102, 241, 0.1); border-radius: 8px; font-family: 'Courier New', monospace;">$${formula}$</div>`
        );
      }
    });
    
    // Reemplazar placeholders inline con HTML renderizado por KaTeX
    inlinePlaceholders.forEach((formula, index) => {
      try {
        const rendered = katex.renderToString(formula, {
          displayMode: false,
          throwOnError: false,
        });
        processed = processed.replace(
          `__MATH_INLINE_${index}__`,
          `<span style="background: rgba(99, 102, 241, 0.15); padding: 0.2em 0.4em; border-radius: 4px;">${rendered}</span>`
        );
      } catch (e) {
        // Si KaTeX falla, mostrar la fórmula como texto
        processed = processed.replace(
          `__MATH_INLINE_${index}__`,
          `<span style="font-family: 'Courier New', monospace; background: rgba(99, 102, 241, 0.15); padding: 0.2em 0.4em; border-radius: 4px;">$${formula}$</span>`
        );
      }
    });
    
    return processed;
  };
  
  // Función para esperar a que todas las imágenes se carguen
  const waitForImages = (element: HTMLElement): Promise<void> => {
    return new Promise((resolve) => {
      const images = element.querySelectorAll('img');
      if (images.length === 0) {
        resolve();
        return;
      }
      
      let loadedCount = 0;
      const totalImages = images.length;
      
      const checkComplete = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve();
        }
      };
      
      images.forEach((img) => {
        if (img.complete && img.naturalHeight !== 0) {
          checkComplete();
        } else {
          img.onload = checkComplete;
          img.onerror = checkComplete; // Continuar incluso si hay errores
        }
      });
      
      // Timeout de seguridad
      setTimeout(() => resolve(), 5000);
    });
  };

  // Función para dividir contenido en secciones que quepan en una página
  const splitContentIntoPages = (container: HTMLElement, maxHeightMM: number): HTMLElement[] => {
    const pages: HTMLElement[] = [];
    const maxHeightPx = maxHeightMM * 3.779527559; // Convertir mm a px (1mm = 3.779527559px a 96dpi)
    
    // Encontrar todos los elementos principales (h2, h3, p, ul, ol, img, table, etc.)
    const allElements: HTMLElement[] = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const el = node as HTMLElement;
          const tagName = el.tagName?.toLowerCase();
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'img', 'table', 'div', 'section'].includes(tagName)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      allElements.push(node as HTMLElement);
    }
    
    let currentPage: HTMLElement | null = null;
    let currentHeight = 0;
    
    for (const el of allElements) {
      const elHeight = el.offsetHeight || el.scrollHeight || 100; // Altura estimada
      const isH2 = el.tagName?.toLowerCase() === 'h2';
      
      // Si es un h2, siempre empezar nueva página
      if (isH2 && currentPage) {
        pages.push(currentPage);
        currentPage = null;
        currentHeight = 0;
      }
      
      // Si el elemento no cabe en la página actual, crear nueva página
      if (currentHeight + elHeight > maxHeightPx && currentPage) {
        pages.push(currentPage);
        currentPage = null;
        currentHeight = 0;
      }
      
      // Crear nueva página si no existe
      if (!currentPage) {
        currentPage = document.createElement('div');
        currentPage.style.cssText = container.style.cssText;
        currentPage.className = container.className;
        currentPage.style.position = 'absolute';
        currentPage.style.left = '-9999px';
        currentPage.style.top = '0';
        currentHeight = 0;
      }
      
      // Clonar y añadir elemento
      const clone = el.cloneNode(true) as HTMLElement;
      currentPage.appendChild(clone);
      currentHeight += elHeight;
    }
    
    if (currentPage) {
      pages.push(currentPage);
    }
    
    return pages;
  };

  // Función para descargar PDF dividiendo por apartados (h2)
  const downloadPDF = async () => {
    console.log('=== INICIANDO GENERACIÓN DE PDF ===');
    if (!notesContentRef.current || !selectedTopic) {
      console.error('No hay contenido o tema seleccionado');
      return;
    }
    
    try {
      const element = notesContentRef.current;
      console.log('Elemento encontrado:', element);
      
      // Mostrar indicador de carga
      const loadingMessage = document.createElement('div');
      loadingMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 8px;
        z-index: 10000;
        font-size: 1rem;
      `;
      loadingMessage.textContent = 'Generando PDF... Por favor espera.';
      document.body.appendChild(loadingMessage);
      
      // Esperar a que todas las imágenes se carguen
      await waitForImages(element);
      
      // Asegurar que las imágenes tengan crossOrigin
      const images = element.querySelectorAll('img');
      images.forEach((img) => {
        if (!img.crossOrigin && (img.src.startsWith('http://') || img.src.startsWith('https://'))) {
          img.crossOrigin = 'anonymous';
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Buscar todos los h2 en todos los contenedores posibles
      const allH2: HTMLElement[] = [];
      
      // Buscar en el elemento principal
      element.querySelectorAll('h2').forEach(h2 => allH2.push(h2 as HTMLElement));
      
      // Buscar en contenedores específicos
      const htmlContent = element.querySelector('.notes-html-content');
      const markdownContent = element.querySelector('.notes-markdown-content');
      const notesContainer = element.querySelector('.notes-container');
      
      if (htmlContent) {
        htmlContent.querySelectorAll('h2').forEach(h2 => {
          if (!allH2.includes(h2 as HTMLElement)) {
            allH2.push(h2 as HTMLElement);
          }
        });
      }
      
      if (markdownContent) {
        markdownContent.querySelectorAll('h2').forEach(h2 => {
          if (!allH2.includes(h2 as HTMLElement)) {
            allH2.push(h2 as HTMLElement);
          }
        });
      }
      
      if (notesContainer) {
        notesContainer.querySelectorAll('h2').forEach(h2 => {
          if (!allH2.includes(h2 as HTMLElement)) {
            allH2.push(h2 as HTMLElement);
          }
        });
      }
      
      // Ordenar h2 por su posición en el DOM
      allH2.sort((a, b) => {
        const position = a.compareDocumentPosition(b);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
      });
      
      console.log(`=== Encontrados ${allH2.length} apartados (h2) ===`);
      allH2.forEach((h2, idx) => {
        console.log(`  ${idx + 1}. ${h2.textContent?.substring(0, 60)}...`);
      });
      
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const usableHeight = pageHeight - (2 * margin);
      
      if (allH2.length > 0) {
        // Procesar cada sección (h2 y su contenido hasta el siguiente h2)
        for (let i = 0; i < allH2.length; i++) {
          const h2 = allH2[i];
          const nextH2 = allH2[i + 1];
          
          console.log(`\n[${i + 1}/${allH2.length}] Procesando: ${h2.textContent?.substring(0, 50)}...`);
          
          // Encontrar el contenedor padre que contiene el contenido real
          let contentParent = h2.parentElement;
          
          // Buscar el contenedor de contenido (notes-html-content, notes-markdown-content, o notes-container)
          while (contentParent && 
                 !contentParent.classList.contains('notes-container') && 
                 !contentParent.classList.contains('notes-html-content') && 
                 !contentParent.classList.contains('notes-markdown-content') &&
                 contentParent !== element) {
            contentParent = contentParent.parentElement;
          }
          
          // Si no encontramos un contenedor específico, usar el padre directo del h2
          if (!contentParent || contentParent === element) {
            contentParent = h2.parentElement || element;
          }
          
          console.log(`  Contenedor padre: ${contentParent.className || contentParent.tagName}`);
          
          // Crear contenedor para esta sección con los mismos estilos del elemento original
          const sectionContainer = document.createElement('div');
          const elementStyle = window.getComputedStyle(element);
          sectionContainer.style.cssText = elementStyle.cssText;
          sectionContainer.className = element.className;
          sectionContainer.style.width = (element.offsetWidth || 1200) + 'px';
          sectionContainer.style.position = 'absolute';
          sectionContainer.style.left = '-9999px';
          sectionContainer.style.top = '0';
          sectionContainer.style.backgroundColor = '#ffffff';
          sectionContainer.style.padding = elementStyle.padding || '4rem';
          sectionContainer.style.margin = '0';
          sectionContainer.style.maxWidth = elementStyle.maxWidth || '1200px';
          
          // Obtener todos los hijos directos del contenedor padre
          const allChildren = Array.from(contentParent.children) as HTMLElement[];
          const h2Index = allChildren.indexOf(h2);
          
          if (h2Index === -1) {
            console.warn(`  ⚠️ No se encontró h2 en los hijos directos, intentando búsqueda recursiva...`);
            // Si no está en los hijos directos, buscar recursivamente
            const findH2Index = (parent: Element, target: HTMLElement, startIndex: number = 0): number => {
              for (let j = startIndex; j < parent.children.length; j++) {
                const child = parent.children[j];
                if (child === target) return j;
                if (child.contains(target)) {
                  return j;
                }
              }
              return -1;
            };
            
            const recursiveIndex = findH2Index(contentParent, h2);
            if (recursiveIndex !== -1) {
              console.log(`  ✓ Encontrado en índice recursivo: ${recursiveIndex}`);
            }
          }
          
          const nextH2Index = nextH2 ? allChildren.indexOf(nextH2) : allChildren.length;
          
          console.log(`  Clonando elementos del índice ${h2Index} al ${nextH2Index - 1} (${nextH2Index - h2Index} elementos)`);
          
          // Dividir la sección en chunks que quepan en una página
          // Agrupar elementos relacionados (párrafos, listas, imágenes) para evitar cortes
          const chunks: HTMLElement[][] = [];
          let currentChunk: HTMLElement[] = [];
          
          // Función para verificar si un elemento es "no divisible" (imagen, tabla, etc.)
          const isNonDivisible = (el: HTMLElement): boolean => {
            const tag = el.tagName?.toLowerCase();
            return ['img', 'table', 'pre', 'blockquote', 'figure'].includes(tag || '');
          };
          
          // Función para verificar si un elemento es de texto (párrafo, lista, etc.)
          const isTextElement = (el: HTMLElement): boolean => {
            const tag = el.tagName?.toLowerCase();
            return ['p', 'ul', 'ol', 'li', 'h3', 'h4', 'h5', 'h6'].includes(tag || '');
          };
          
          // Clonar elementos primero
          const clonedElements: HTMLElement[] = [];
          for (let j = h2Index; j < nextH2Index; j++) {
            const child = allChildren[j];
            if (!child) continue;
            
            const clone = child.cloneNode(true) as HTMLElement;
            const childStyle = window.getComputedStyle(child);
            clone.style.cssText = childStyle.cssText;
            clonedElements.push(clone);
          }
          
          // Crear un contenedor temporal para medir alturas reales con los mismos estilos
          const measureContainer = document.createElement('div');
          measureContainer.style.cssText = sectionContainer.style.cssText;
          measureContainer.style.position = 'absolute';
          measureContainer.style.left = '-9999px';
          measureContainer.style.top = '0';
          measureContainer.style.visibility = 'hidden';
          measureContainer.style.width = sectionContainer.style.width;
          measureContainer.style.padding = sectionContainer.style.padding;
          measureContainer.style.margin = sectionContainer.style.margin;
          measureContainer.style.maxWidth = sectionContainer.style.maxWidth;
          document.body.appendChild(measureContainer);
          
          // Agrupar elementos en chunks basándose en alturas reales
          for (let elemIdx = 0; elemIdx < clonedElements.length; elemIdx++) {
            const element = clonedElements[elemIdx];
            const isNonDiv = isNonDivisible(element);
            const isText = isTextElement(element);
            
            // Medir altura del elemento solo primero
            measureContainer.innerHTML = '';
            const elementClone = element.cloneNode(true) as HTMLElement;
            measureContainer.appendChild(elementClone);
            
            // Forzar renderizado
            measureContainer.offsetHeight;
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const elementHeightPx = measureContainer.scrollHeight;
            const containerWidthPx = measureContainer.offsetWidth || 1200;
            const elementHeightMM = (elementHeightPx * imgWidth) / (containerWidthPx * 3.779527559);
            
            // Si el elemento es muy grande (más del 80% de la página), va en su propio chunk
            if (elementHeightMM > usableHeight * 0.8) {
              // Guardar chunk actual si tiene contenido
              if (currentChunk.length > 0) {
                chunks.push([...currentChunk]);
                currentChunk = [];
              }
              // Este elemento va en su propio chunk
              chunks.push([element]);
              continue;
            }
            
            // Medir altura del chunk actual + este elemento
            measureContainer.innerHTML = '';
            if (currentChunk.length > 0) {
              currentChunk.forEach(el => {
                const elClone = el.cloneNode(true) as HTMLElement;
                measureContainer.appendChild(elClone);
              });
            }
            measureContainer.appendChild(elementClone);
            
            // Forzar renderizado
            measureContainer.offsetHeight;
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const chunkHeightPx = measureContainer.scrollHeight;
            const chunkHeightMM = (chunkHeightPx * imgWidth) / (containerWidthPx * 3.779527559);
            
            // Si el chunk con este elemento no cabe (con margen de seguridad del 80%), empezar nuevo chunk
            // Usamos 80% para dejar más margen y evitar cortes
            if (chunkHeightMM > usableHeight * 0.80 && currentChunk.length > 0) {
              chunks.push([...currentChunk]);
              currentChunk = [];
              
              // Reiniciar medición solo con este elemento
              measureContainer.innerHTML = '';
              measureContainer.appendChild(elementClone);
              
              // Verificar que el elemento solo también quepa
              measureContainer.offsetHeight;
              await new Promise(resolve => setTimeout(resolve, 10));
              const singleElementHeightPx = measureContainer.scrollHeight;
              const singleElementHeightMM = (singleElementHeightPx * imgWidth) / (containerWidthPx * 3.779527559);
              
              // Si el elemento solo no cabe, va en su propio chunk (se dividirá después si es necesario)
              if (singleElementHeightMM > usableHeight * 0.95) {
                chunks.push([element]);
                continue;
              }
            }
            
            // Añadir elemento al chunk actual
            currentChunk.push(element);
          }
          
          // Limpiar contenedor de medición
          if (document.body.contains(measureContainer)) {
            document.body.removeChild(measureContainer);
          }
          
          // Añadir último chunk si queda algo
          if (currentChunk.length > 0) {
            chunks.push(currentChunk);
          }
          
          console.log(`  Dividido en ${chunks.length} chunks`);
          
          // Procesar cada chunk
          try {
          for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
            const chunk = chunks[chunkIdx];
            
            // Crear contenedor para este chunk
            const chunkContainer = document.createElement('div');
            chunkContainer.style.cssText = window.getComputedStyle(element).cssText;
            chunkContainer.className = element.className;
            chunkContainer.style.width = (element.offsetWidth || 1200) + 'px';
            chunkContainer.style.position = 'absolute';
            chunkContainer.style.left = '-9999px';
            chunkContainer.style.top = '0';
            chunkContainer.style.backgroundColor = '#ffffff';
            chunkContainer.style.padding = window.getComputedStyle(element).padding || '4rem';
            chunkContainer.style.margin = '0';
            chunkContainer.style.maxWidth = window.getComputedStyle(element).maxWidth || '1200px';
            
            // Si es el primer chunk de la sección, incluir el h2
            if (chunkIdx === 0) {
              const h2Clone = h2.cloneNode(true) as HTMLElement;
              const h2Style = window.getComputedStyle(h2);
              h2Clone.style.cssText = h2Style.cssText;
              chunkContainer.appendChild(h2Clone);
            }
            
            // Añadir elementos del chunk
            chunk.forEach(el => chunkContainer.appendChild(el));
            
            document.body.appendChild(chunkContainer);
            
            try {
              // Asegurar crossOrigin en imágenes
              chunkContainer.querySelectorAll('img').forEach((img) => {
                if (!img.crossOrigin && (img.src.startsWith('http://') || img.src.startsWith('https://'))) {
                  img.crossOrigin = 'anonymous';
                }
                // Asegurar que las imágenes se muestren completas
                img.style.pageBreakInside = 'avoid';
                img.style.breakInside = 'avoid';
              });
              
              await waitForImages(chunkContainer);
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Forzar reflow
              chunkContainer.offsetHeight;
              
              // Capturar el chunk
              const canvas = await html2canvas(chunkContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                logging: false,
                backgroundColor: "#ffffff",
                imageTimeout: 15000,
                windowWidth: chunkContainer.scrollWidth,
                windowHeight: chunkContainer.scrollHeight,
              });
              
              const imgData = canvas.toDataURL("image/png", 1.0);
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              // SIEMPRE empezar cada apartado (h2) en una nueva página
              // Y cada chunk adicional también en nueva página
              if (i === 0 && chunkIdx === 0) {
                // Primer apartado, primera página - no añadir página nueva
              } else {
                // Cualquier otro caso: nueva página
                pdf.addPage();
              }
              
              // Verificar si el chunk cabe en una página
              if (imgHeight <= usableHeight) {
                pdf.addImage(imgData, "PNG", margin, margin, imgWidth - (2 * margin), imgHeight);
                console.log(`    Chunk ${chunkIdx + 1}/${chunks.length} añadido (${imgHeight.toFixed(1)}mm)`);
              } else {
                // Si el chunk es muy grande (imagen grande, tabla grande), dividirlo
                console.log(`    Chunk ${chunkIdx + 1}/${chunks.length} es muy grande (${imgHeight.toFixed(1)}mm), dividiendo...`);
                const totalPages = Math.ceil(imgHeight / usableHeight);
                const pixelsPerMM = canvas.height / imgHeight;
                const pixelsPerPage = usableHeight * pixelsPerMM;
                
                for (let pageNum = 0; pageNum < totalPages; pageNum++) {
                  if (pageNum > 0) {
                    pdf.addPage();
                  }
                  
                  const sourceY = pageNum * pixelsPerPage;
                  const sourceHeight = Math.min(pixelsPerPage, canvas.height - sourceY);
                  const displayHeight = sourceHeight / pixelsPerMM;
                  
                  const pageCanvas = document.createElement('canvas');
                  pageCanvas.width = canvas.width;
                  pageCanvas.height = sourceHeight;
                  const pageCtx = pageCanvas.getContext('2d');
                  
                  if (pageCtx) {
                    pageCtx.drawImage(
                      canvas,
                      0, sourceY,
                      canvas.width, sourceHeight,
                      0, 0,
                      canvas.width, sourceHeight
                    );
                    
                    const pageImgData = pageCanvas.toDataURL("image/png", 1.0);
                    pdf.addImage(pageImgData, "PNG", margin, margin, imgWidth - (2 * margin), displayHeight);
                  }
                }
              }
            } finally {
              if (document.body.contains(chunkContainer)) {
                document.body.removeChild(chunkContainer);
              }
            }
          }
          } catch (sectionError) {
            console.error(`Error procesando sección ${i + 1}:`, sectionError);
          }
        }
      } else {
        console.log('=== NO SE ENCONTRARON H2, PROCESANDO TODO EL CONTENIDO ===');
        // Si no hay h2, procesar todo el contenido pero dividiéndolo mejor
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#ffffff",
          imageTimeout: 15000,
          removeContainer: false,
          onclone: (clonedDoc) => {
            const clonedImages = clonedDoc.querySelectorAll('img');
            clonedImages.forEach((img) => {
              if (!img.crossOrigin && (img.src.startsWith('http://') || img.src.startsWith('https://'))) {
                img.crossOrigin = 'anonymous';
              }
            });
          },
        });
        
        const imgData = canvas.toDataURL("image/png", 1.0);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        console.log(`Altura total del contenido: ${imgHeight.toFixed(2)}mm`);
        
        // Dividir en páginas de manera más inteligente
        const totalPages = Math.ceil(imgHeight / usableHeight);
        console.log(`Dividiendo en ${totalPages} páginas`);
        
        const pixelsPerMM = canvas.height / imgHeight;
        const pixelsPerPage = usableHeight * pixelsPerMM;
        
        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          if (pageNum > 0) {
            pdf.addPage();
          }
          
          const sourceY = pageNum * pixelsPerPage;
          const sourceHeight = Math.min(pixelsPerPage, canvas.height - sourceY);
          const displayHeight = (sourceHeight / pixelsPerMM);
          
          // Crear un canvas temporal para esta porción
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, sourceY,
              canvas.width, sourceHeight,
              0, 0,
              canvas.width, sourceHeight
            );
            
            const pageImgData = pageCanvas.toDataURL("image/png", 1.0);
            pdf.addImage(pageImgData, "PNG", margin, margin, imgWidth - (2 * margin), displayHeight);
            console.log(`Página ${pageNum + 1}/${totalPages} añadida`);
          }
        }
      }
      
      // Remover indicador de carga
      if (document.body.contains(loadingMessage)) {
        document.body.removeChild(loadingMessage);
      }
      
      const safeTopicName = selectedTopic.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const fileName = `${course?.title || "curso"}_${safeTopicName}.pdf`;
      pdf.save(fileName);
      console.log(`=== PDF GENERADO EXITOSAMENTE: ${fileName} ===`);
    } catch (error) {
      console.error("=== ERROR GENERANDO PDF ===", error);
      alert("Error al generar el PDF. Por favor, intenta de nuevo. Si el problema persiste, verifica que las imágenes se carguen correctamente.");
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
          if (loadedCourse && loadedCourse.topics.length > 0) {
            setSelectedTopic(loadedCourse.topics[0].name);
          }
        }
      }

      // Cargar inscripción
      const enrollmentResponse = await fetch("/api/study-agents/get-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          courseId,
        }),
      });

      if (enrollmentResponse.ok) {
        const enrollmentData = await enrollmentResponse.json();
        if (enrollmentData.success) {
          // Actualizar último acceso al curso
          try {
            await fetch("/api/study-agents/update-enrollment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: session?.user?.id,
                courseId,
                updates: {
                  last_accessed: new Date().toISOString(),
                },
              }),
            });
          } catch (error) {
            console.error("Error actualizando último acceso:", error);
          }
          
          // Actualizar racha y créditos antes de cargar la inscripción
          try {
            const streakResponse = await fetch("/api/study-agents/update-streak-credits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: session?.user?.id,
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
              userId: session?.user?.id,
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
          const courseSummaries = loadedCourse?.summaries;
          if (courseSummaries) {
            Object.keys(courseSummaries).forEach((topicName) => {
              const topicSummaryData = courseSummaries[topicName];
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
          userId: session?.user?.id,
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
            userId: session?.user?.id,
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
          userId: session?.user?.id,
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
          userId: session?.user?.id,
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
          const userId = session?.user?.id;
          if (data.success && userId) {
            const userReview = data.reviews.find((r: any) => r.user_id === userId);
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
                      user_id: session?.user?.id,
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
                    const days: React.ReactElement[] = [];
                    
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
                                      user_id: session?.user?.id,
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
                                        user_id: session?.user?.id,
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
          {session?.user?.id && <CourseRanking courseId={courseId} currentUserId={session?.user?.id} />}
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
                        user_id: session?.user?.id,
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
                      maxWidth: "1200px", // Ancho más amplio para mejor legibilidad
                      width: "100%",
                      margin: "0 auto",
                      minHeight: "297mm", // A4 height
                      color: "#1f2937",
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
                      lineHeight: "1.7",
                      fontSize: "1rem",
                    }}
                    className="notes-container"
                  >
                    <style jsx>{`
                      .notes-container {
                        page-break-after: always;
                      }
                      
                      /* Separación y paginación para títulos */
                      .notes-container h1 {
                        page-break-after: avoid;
                        page-break-inside: avoid;
                        page-break-before: always;
                        margin-top: 3rem;
                        margin-bottom: 2rem;
                        padding-bottom: 1rem;
                        border-bottom: 3px solid #6366f1;
                      }
                      
                      .notes-container h1:first-child {
                        page-break-before: auto;
                        margin-top: 0;
                      }
                      
                      .notes-container h2 {
                        page-break-after: avoid;
                        page-break-inside: avoid;
                        page-break-before: always;
                        margin-top: 3rem; /* Más espacio antes para evitar cortes */
                        margin-bottom: 2rem; /* Más espacio después */
                        padding-top: 1.5rem;
                        padding-bottom: 1rem; /* Más padding para mejor separación */
                        border-top: 2px solid #e5e7eb;
                        border-bottom: 2px solid #e5e7eb;
                        background: #f9fafb;
                        padding-left: 1rem;
                        padding-right: 1rem;
                        border-radius: 4px;
                        break-after: avoid;
                        break-inside: avoid;
                        break-before: page;
                        min-height: 4em; /* Altura mínima para evitar cortes */
                      }
                      
                      .notes-container h2:first-child {
                        page-break-before: auto;
                        break-before: auto;
                        margin-top: 0;
                        border-top: none;
                      }
                      
                      /* Agrupar contenido después de h2 para evitar cortes */
                      .notes-container h2 ~ * {
                        page-break-before: avoid;
                        break-before: avoid;
                      }
                      
                      /* Hasta el siguiente h2 o h1, mantener junto */
                      .notes-container h2 ~ *:not(h1):not(h2) {
                        page-break-inside: avoid;
                        break-inside: avoid;
                      }
                      
                      .notes-container h3 {
                        page-break-after: avoid;
                        page-break-inside: avoid;
                        page-break-before: avoid;
                        break-after: avoid;
                        break-inside: avoid;
                        break-before: avoid;
                        margin-top: 2.5rem; /* Más espacio antes */
                        margin-bottom: 1.5rem; /* Más espacio después */
                        padding-top: 0.75rem;
                        padding-bottom: 0.75rem; /* Más padding */
                        border-left: 4px solid #6366f1;
                        padding-left: 1rem;
                        background: #f9fafb;
                        border-radius: 2px;
                        min-height: 3em; /* Altura mínima */
                      }
                      
                      /* Agrupar contenido después de h3 */
                      .notes-container h3 ~ *:not(h1):not(h2):not(h3) {
                        page-break-before: avoid;
                        break-before: avoid;
                      }
                      
                      /* Evitar que elementos queden cortados entre páginas */
                      .notes-container p {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        orphans: 4;
                        widows: 4;
                        margin-bottom: 1rem;
                        min-height: 2em; /* Evitar párrafos muy cortos al final de página */
                      }
                      
                      .notes-container ul,
                      .notes-container ol {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        page-break-before: avoid;
                        break-before: avoid;
                        margin-top: 1rem;
                        margin-bottom: 1.5rem;
                        padding-left: 2rem;
                      }
                      
                      .notes-container li {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        margin-bottom: 0.5rem;
                        orphans: 3;
                        widows: 3;
                        min-height: 1.5em; /* Evitar items muy cortos */
                      }
                      
                      /* Evitar que el último item de una lista quede solo */
                      .notes-container li:last-child {
                        page-break-after: avoid;
                        break-after: avoid;
                      }
                      
                      .notes-container img {
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        page-break-before: avoid;
                        max-width: 100% !important;
                        height: auto !important;
                        display: block;
                        margin: 2rem auto;
                      }
                      
                      .notes-container table {
                        width: 100%;
                        border-collapse: collapse;
                        border-spacing: 0;
                        margin: 1.5rem 0;
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        border: 2px solid #1f2937;
                        background: #ffffff;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                      }
                      
                      .notes-container table th,
                      .notes-container table td {
                        border: 1px solid #4b5563;
                        border-top: 1px solid #4b5563;
                        border-right: 1px solid #4b5563;
                        border-bottom: 1px solid #4b5563;
                        border-left: 1px solid #4b5563;
                        padding: 0.75rem;
                        text-align: left;
                        background: #ffffff;
                      }
                      
                      .notes-container table th {
                        background: #f3f4f6;
                        font-weight: 600;
                        border: 2px solid #374151;
                        border-bottom: 3px solid #6366f1;
                      }
                      
                      .notes-container table thead th {
                        border-bottom: 3px solid #6366f1;
                        border-top: 2px solid #374151;
                        border-left: 2px solid #374151;
                        border-right: 2px solid #374151;
                      }
                      
                      .notes-container table tbody tr {
                        border-bottom: 1px solid #4b5563;
                      }
                      
                      .notes-container table tbody tr:last-child td {
                        border-bottom: 2px solid #374151;
                      }
                      
                      .notes-container table tbody {
                        border-top: 2px solid #374151;
                      }
                      
                      .notes-container table tr:nth-child(even) td {
                        background: #f9fafb;
                      }
                      
                      .notes-container table tr:hover td {
                        background: #f3f4f6;
                      }
                      
                      .notes-container pre {
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        overflow-x: auto;
                        margin: 1.5rem 0;
                      }
                      
                      .notes-container blockquote {
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        margin: 1.5rem 0;
                        padding: 1rem;
                        border-left: 4px solid #6366f1;
                        background: #f9fafb;
                      }
                      
                      .notes-container code {
                        page-break-inside: avoid;
                      }
                      
                      .notes-container div {
                        page-break-inside: avoid;
                        break-inside: avoid;
                      }
                      
                      /* Agrupar secciones completas */
                      .notes-container h2 + *,
                      .notes-container h3 + * {
                        page-break-before: avoid;
                        break-before: avoid;
                      }
                      
                      /* Mantener al menos 2 líneas juntas al final de página */
                      .notes-container p,
                      .notes-container li {
                        orphans: 4;
                        widows: 4;
                      }
                      
                      /* Separador visual entre apartados y evitar cortes */
                      .notes-container h2 + *,
                      .notes-container h3 + * {
                        margin-top: 0;
                        page-break-before: avoid;
                        break-before: avoid;
                      }
                      
                      /* Mantener al menos 4 líneas juntas al final de página */
                      .notes-container p,
                      .notes-container li {
                        orphans: 4;
                        widows: 4;
                      }
                      
                      /* Espaciado después de listas y párrafos */
                      .notes-container p + h2,
                      .notes-container p + h3,
                      .notes-container ul + h2,
                      .notes-container ul + h3,
                      .notes-container ol + h2,
                      .notes-container ol + h3 {
                        margin-top: 2rem;
                      }
                      
                      /* Estilos para impresión */
                      @media print {
                        .notes-container {
                          page-break-after: always;
                          padding: 2rem;
                        }
                        
                        .notes-container h2 {
                          page-break-before: always;
                          margin-top: 0;
                        }
                        
                        .notes-container h2:first-child {
                          page-break-before: auto;
                        }
                      }
                      /* Estilos para contenido HTML y Markdown */
                      .notes-html-content h1,
                      .notes-markdown-content h1 {
                        page-break-after: avoid;
                        page-break-inside: avoid;
                        page-break-before: always;
                        margin-top: 3rem;
                        margin-bottom: 2rem;
                        padding-bottom: 1rem;
                        border-bottom: 3px solid #6366f1;
                      }
                      
                      .notes-html-content h1:first-child,
                      .notes-markdown-content h1:first-child {
                        page-break-before: auto;
                        margin-top: 0;
                      }
                      
                      .notes-html-content h2,
                      .notes-markdown-content h2 {
                        page-break-after: avoid;
                        page-break-inside: avoid;
                        page-break-before: always;
                        break-after: avoid;
                        break-inside: avoid;
                        break-before: page;
                        margin-top: 3rem; /* Más espacio antes */
                        margin-bottom: 2rem; /* Más espacio después */
                        padding-top: 1.5rem;
                        padding-bottom: 1rem; /* Más padding */
                        border-top: 2px solid #e5e7eb;
                        border-bottom: 2px solid #e5e7eb;
                        background: #f9fafb;
                        padding-left: 1rem;
                        padding-right: 1rem;
                        border-radius: 4px;
                        min-height: 4em; /* Altura mínima */
                      }
                      
                      .notes-html-content h2:first-child,
                      .notes-markdown-content h2:first-child {
                        page-break-before: auto;
                        break-before: auto;
                        margin-top: 0;
                        border-top: none;
                      }
                      
                      /* Agrupar contenido después de h2 */
                      .notes-html-content h2 ~ *,
                      .notes-markdown-content h2 ~ * {
                        page-break-before: avoid;
                        break-before: avoid;
                      }
                      
                      .notes-html-content h2 ~ *:not(h1):not(h2),
                      .notes-markdown-content h2 ~ *:not(h1):not(h2) {
                        page-break-inside: avoid;
                        break-inside: avoid;
                      }
                      
                      .notes-html-content h3,
                      .notes-markdown-content h3 {
                        page-break-after: avoid;
                        page-break-inside: avoid;
                        page-break-before: avoid;
                        break-after: avoid;
                        break-inside: avoid;
                        break-before: avoid;
                        margin-top: 2.5rem; /* Más espacio antes */
                        margin-bottom: 1.5rem; /* Más espacio después */
                        padding-top: 0.75rem;
                        padding-bottom: 0.75rem; /* Más padding */
                        border-left: 4px solid #6366f1;
                        padding-left: 1rem;
                        background: #f9fafb;
                        border-radius: 2px;
                        min-height: 3em; /* Altura mínima */
                      }
                      
                      /* Agrupar contenido después de h3 */
                      .notes-html-content h3 ~ *:not(h1):not(h2):not(h3),
                      .notes-markdown-content h3 ~ *:not(h1):not(h2):not(h3) {
                        page-break-before: avoid;
                        break-before: avoid;
                      }
                      
                      .notes-html-content p,
                      .notes-markdown-content p {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        orphans: 4;
                        widows: 4;
                        margin-bottom: 1rem;
                        min-height: 2em;
                      }
                      
                      .notes-html-content ul,
                      .notes-html-content ol,
                      .notes-markdown-content ul,
                      .notes-markdown-content ol {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        page-break-before: avoid;
                        break-before: avoid;
                        page-break-after: avoid;
                        break-after: avoid;
                        margin-top: 1rem;
                        margin-bottom: 1.5rem;
                        padding-left: 2rem;
                      }
                      
                      .notes-html-content li,
                      .notes-markdown-content li {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        margin-bottom: 0.5rem;
                        orphans: 3;
                        widows: 3;
                        min-height: 1.5em;
                      }
                      
                      .notes-html-content li:last-child,
                      .notes-markdown-content li:last-child {
                        page-break-after: avoid;
                        break-after: avoid;
                      }
                      
                      .notes-html-content img {
                        max-width: 100% !important;
                        height: auto !important;
                        display: block;
                        margin: 2rem auto;
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        page-break-before: avoid;
                      }
                      
                      .notes-html-content table,
                      .notes-markdown-content table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        border-spacing: 0 !important;
                        margin: 1.5rem 0 !important;
                        border: 2px solid #1f2937 !important;
                        background: #ffffff !important;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        page-break-inside: avoid;
                        page-break-after: avoid;
                      }
                      
                      .notes-html-content table th,
                      .notes-html-content table td,
                      .notes-markdown-content table th,
                      .notes-markdown-content table td {
                        border: 1px solid #4b5563 !important;
                        border-top: 1px solid #4b5563 !important;
                        border-right: 1px solid #4b5563 !important;
                        border-bottom: 1px solid #4b5563 !important;
                        border-left: 1px solid #4b5563 !important;
                        padding: 0.75rem 1rem !important;
                        text-align: left !important;
                        background: #ffffff !important;
                        vertical-align: top;
                      }
                      
                      .notes-html-content table th,
                      .notes-markdown-content table th {
                        background: #f3f4f6 !important;
                        font-weight: 700 !important;
                        border: 2px solid #374151 !important;
                        border-bottom: 3px solid #6366f1 !important;
                        color: #111827 !important;
                        font-size: 0.95rem;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                      }
                      
                      .notes-html-content table thead th,
                      .notes-markdown-content table thead th {
                        border-bottom: 3px solid #6366f1 !important;
                        border-top: 2px solid #374151 !important;
                        border-left: 2px solid #374151 !important;
                        border-right: 2px solid #374151 !important;
                      }
                      
                      .notes-html-content table tbody tr,
                      .notes-markdown-content table tbody tr {
                        border-bottom: 1px solid #4b5563 !important;
                      }
                      
                      .notes-html-content table tbody tr:last-child td,
                      .notes-markdown-content table tbody tr:last-child td {
                        border-bottom: 2px solid #374151 !important;
                      }
                      
                      .notes-html-content table tr:nth-child(even) td,
                      .notes-markdown-content table tr:nth-child(even) td {
                        background: #f9fafb !important;
                      }
                      
                      .notes-html-content table tr:hover td,
                      .notes-markdown-content table tr:hover td {
                        background: #f3f4f6 !important;
                      }
                      
                      .notes-html-content table thead,
                      .notes-markdown-content table thead {
                        background: #f3f4f6 !important;
                      }
                      
                      .notes-html-content table tbody,
                      .notes-markdown-content table tbody {
                        border-top: 2px solid #374151 !important;
                      }
                      
                      .notes-html-content pre,
                      .notes-markdown-content pre {
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        overflow-x: auto;
                        margin: 1.5rem 0;
                      }
                      
                      .notes-html-content blockquote,
                      .notes-markdown-content blockquote {
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        margin: 1.5rem 0;
                        padding: 1rem;
                        border-left: 4px solid #6366f1;
                        background: #f9fafb;
                      }
                      
                      .notes-html-content code,
                      .notes-markdown-content code {
                        page-break-inside: avoid;
                      }
                      
                      .notes-html-content div,
                      .notes-markdown-content div {
                        page-break-inside: avoid;
                      }
                      
                      /* Separador visual entre apartados en HTML/Markdown y evitar cortes */
                      .notes-html-content h2 + *,
                      .notes-html-content h3 + *,
                      .notes-markdown-content h2 + *,
                      .notes-markdown-content h3 + * {
                        margin-top: 0;
                        page-break-before: avoid;
                        break-before: avoid;
                      }
                      
                      /* Mantener al menos 4 líneas juntas al final de página */
                      .notes-html-content p,
                      .notes-html-content li,
                      .notes-markdown-content p,
                      .notes-markdown-content li {
                        orphans: 4;
                        widows: 4;
                      }
                      
                      /* Espaciado después de listas y párrafos en HTML/Markdown */
                      .notes-html-content p + h2,
                      .notes-html-content p + h3,
                      .notes-html-content ul + h2,
                      .notes-html-content ul + h3,
                      .notes-html-content ol + h2,
                      .notes-html-content ol + h3,
                      .notes-markdown-content p + h2,
                      .notes-markdown-content p + h3,
                      .notes-markdown-content ul + h2,
                      .notes-markdown-content ul + h3,
                      .notes-markdown-content ol + h2,
                      .notes-markdown-content ol + h3 {
                        margin-top: 2rem;
                      }
                      
                      /* Estilos para impresión en HTML/Markdown */
                      @media print {
                        .notes-html-content h2,
                        .notes-markdown-content h2 {
                          page-break-before: always;
                          margin-top: 0;
                        }
                        
                        .notes-html-content h2:first-child,
                        .notes-markdown-content h2:first-child {
                          page-break-before: auto;
                        }
                      }
                    `}</style>
                    {/* Detectar si es HTML o Markdown */}
                    {topicSummary[selectedTopic].trim().startsWith('<') || 
                     topicSummary[selectedTopic].includes('<div') || 
                     topicSummary[selectedTopic].includes('<h1') || 
                     topicSummary[selectedTopic].includes('<p') ? (
                      // Es HTML, usar dangerouslySetInnerHTML con procesamiento de fórmulas
                      <div 
                        className="notes-html-content"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(fixImageUrls(processMathFormulas(topicSummary[selectedTopic])), {
                            ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'section', 'span', 'hr', 'blockquote', 'br', 'img'],
                            ALLOWED_ATTR: ['style', 'class', 'id', 'src', 'alt', 'title', 'crossorigin', 'crossOrigin'],
                            ALLOW_DATA_ATTR: false,
                            KEEP_CONTENT: true,
                            FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
                            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
                            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
                          })
                        }}
                        style={{
                          color: "#1f2937",
                          lineHeight: "1.7",
                          fontSize: "1rem",
                        }}
                      />
                    ) : (
                      // Es Markdown, usar ReactMarkdown con procesamiento de fórmulas
                      <div 
                        className="notes-markdown-content"
                        style={{
                          color: "#1f2937",
                          lineHeight: "1.7",
                          fontSize: "1rem",
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
                            img: ({ ...props }) => {
                              // Corregir URL de imagen si es relativa
                              const src = props.src ?? '';
                              const srcStr = typeof src === 'string' ? src : '';
                              const fixedSrc = typeof src === 'string' && srcStr.startsWith('/api/files/') 
                                ? (typeof window !== 'undefined' 
                                    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                                      ? `http://localhost:8000${srcStr}`
                                      : srcStr.replace(':3000', ':8000')
                                    : `http://localhost:8000${srcStr}`)
                                : src;
                              return <img 
                                {...props} 
                                src={fixedSrc} 
                                crossOrigin="anonymous"
                                style={{ maxWidth: "100%", height: "auto", borderRadius: "8px", margin: "1.5rem 0", display: "block", marginLeft: "auto", marginRight: "auto" }} 
                                onError={(e) => {
                                  console.error("Error cargando imagen:", fixedSrc);
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />;
                            },
                            table: ({ ...props }) => <table {...props} style={{ width: "100%", borderCollapse: "collapse", borderSpacing: "0", margin: "1.5rem 0", border: "2px solid #1f2937", background: "#ffffff", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }} />,
                            thead: ({ ...props }) => <thead {...props} style={{ background: "#f3f4f6" }} />,
                            tbody: ({ ...props }) => <tbody {...props} style={{ borderTop: "2px solid #374151" }} />,
                            tr: ({ ...props }) => <tr {...props} style={{ borderBottom: "1px solid #4b5563" }} />,
                            th: ({ ...props }) => <th {...props} style={{ border: "2px solid #374151", borderBottom: "3px solid #6366f1", borderTop: "2px solid #374151", borderLeft: "2px solid #374151", borderRight: "2px solid #374151", padding: "0.75rem 1rem", textAlign: "left", fontWeight: "700", background: "#f3f4f6", color: "#111827", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }} />,
                            td: ({ ...props }) => <td {...props} style={{ border: "1px solid #4b5563", borderTop: "1px solid #4b5563", borderRight: "1px solid #4b5563", borderBottom: "1px solid #4b5563", borderLeft: "1px solid #4b5563", padding: "0.75rem 1rem", textAlign: "left", background: "#ffffff", verticalAlign: "top" }} />,
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
                userId={session?.user?.id}
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
                          userId: session?.user?.id,
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
