"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiAcademicCap, HiPlus, HiArrowRight, HiClock, HiUserGroup, HiStar, HiMagnifyingGlass, HiBookOpen, HiSparkles, HiChevronLeft, HiChevronRight, HiXMark, HiCreditCard, HiShieldCheck, HiLockClosed, HiCheckCircle } from "react-icons/hi2";
import { TbTrophy, TbCoins, TbWallet } from "react-icons/tb";

interface Course {
  course_id: string;
  creator_id: string;
  title: string;
  description: string;
  price: number;
  max_duration_days?: number;
  cover_image?: string;
  is_exam?: boolean;
  institution?: { name: string; logo?: string } | null;
  subject?: string | null; // Asignatura/Curso/Tipo de examen
  topics: Array<{ name: string; pdfs: string[]; subtopics?: Array<{ name: string; pdfs: string[] }> }>;
  enrollment_count: number;
  satisfaction_rating: number | null;
  satisfaction_count: number;
  created_at: string;
}

interface Enrollment {
  course: Course;
  enrollment: {
    user_id: string;
    course_id: string;
    enrolled_at: string;
    credits_remaining: number;
    credits_used: number;
    xp: number;
    topic_progress: Record<string, number>;
    exam_date?: string;
    end_date?: string;
    last_accessed?: string;
    last_connection_date?: string;
    updated_at?: string;
  };
}

export default function CoursesMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"my-courses" | "all-courses">("my-courses");
  const [showExamDateModal, setShowExamDateModal] = useState(false);
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<string | null>(null);
  const [examDateInput, setExamDateInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState<Course | null>(null);
  const [courseReviews, setCourseReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
      loadWallet();
    }
  }, [session]);

  // Detectar tamaño de pantalla para responsive
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(isMobile);
      setIsTablet(window.innerWidth >= 768 && isTablet);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadWallet = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch("/api/study-agents/get-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWalletBalance(data.wallet.balance || 0);
        }
      }
    } catch (error) {
      console.error("Error cargando wallet:", error);
    }
  };

  const handleRechargeWallet = async () => {
    if (!session?.user?.id || !rechargeAmount || !paymentMethod) return;
    
    setLoadingWallet(true);
    try {
      const response = await fetch("/api/study-agents/create-stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          amount: rechargeAmount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.checkout_url) {
          // Redirigir a Stripe Checkout
          window.location.href = data.checkout_url;
        }
      } else {
        const errorData = await response.json();
        setNotification({
          message: errorData.error || "Error al crear sesión de pago",
          type: "error"
        });
        setLoadingWallet(false);
      }
    } catch (error) {
      console.error("Error recargando wallet:", error);
      setNotification({
        message: "Error al recargar wallet. Por favor, inténtalo de nuevo.",
        type: "error"
      });
      setLoadingWallet(false);
    }
  };

  // Verificar si hay parámetros de éxito de Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const walletSuccess = urlParams.get('wallet_success');
    const sessionId = urlParams.get('session_id');
    
    if (walletSuccess === 'true' && sessionId) {
      // Verificar y confirmar el pago con Stripe
      verifyStripePayment(sessionId);
    } else if (walletSuccess === 'true') {
      // Si no hay session_id, solo recargar wallet (por si el webhook ya lo hizo)
      loadWallet();
      setNotification({
        message: "¡Wallet recargado exitosamente!",
        type: "success"
      });
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const verifyStripePayment = async (sessionId: string) => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch("/api/study-agents/verify-stripe-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          sessionId: sessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadWallet(); // Recargar wallet después de confirmar
          setNotification({
            message: `¡Wallet recargado exitosamente! +${data.amount.toFixed(2)}€`,
            type: "success"
          });
        } else {
          setNotification({
            message: data.error || "Error al verificar el pago",
            type: "error"
          });
        }
      } else {
        const errorData = await response.json();
        setNotification({
          message: errorData.error || "Error al verificar el pago",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error verificando pago:", error);
      setNotification({
        message: "Error al verificar el pago. Por favor, recarga la página.",
        type: "error"
      });
    } finally {
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  // Auto-ocultar notificación después de 5 segundos
  useEffect(() => {
    if (notification) {
      // Limpiar timeout anterior si existe
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      // Crear nuevo timeout
      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
    // Cleanup
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [notification]);

  const loadData = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const enrollmentsResponse = await fetch("/api/study-agents/get-user-enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (enrollmentsResponse.ok) {
        const enrollmentsData = await enrollmentsResponse.json();
        if (enrollmentsData.success) {
          // Ordenar enrollments por último acceso (más reciente primero)
          const sortedEnrollments = (enrollmentsData.enrollments || []).sort((a: Enrollment, b: Enrollment) => {
            // Priorizar last_accessed, luego last_connection_date, luego updated_at, luego enrolled_at
            const getDate = (enrollment: Enrollment) => {
              return enrollment.enrollment.last_accessed || 
                     enrollment.enrollment.last_connection_date || 
                     enrollment.enrollment.updated_at || 
                     enrollment.enrollment.enrolled_at || 
                     "1970-01-01T00:00:00Z";
            };
            const dateA = new Date(getDate(a)).getTime();
            const dateB = new Date(getDate(b)).getTime();
            return dateB - dateA; // Más reciente primero
          });
          setEnrollments(sortedEnrollments);
        }
      }

      const coursesResponse = await fetch("/api/study-agents/list-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_only: true }),
      });

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        if (coursesData.success) {
          setAllCourses(coursesData.courses || []);
        }
      }
    } catch (error) {
      console.error("Error cargando cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntil = (dateString?: string) => {
    if (!dateString) return null;
    const today = new Date();
    const target = new Date(dateString);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Gratis";
    return `${price.toFixed(2).replace('.', ',')}€`;
  };

  const handleEnroll = async (courseId: string, examDate: string | null) => {
    try {
      // Obtener API key del usuario si está disponible
      let apiKey = null;
      if (typeof window !== "undefined") {
        const savedKeys = localStorage.getItem("study_agents_api_keys");
        if (savedKeys) {
          try {
            const parsed = JSON.parse(savedKeys);
            apiKey = parsed.openai || null;
          } catch (e) {
            console.error("Error parsing API keys:", e);
          }
        }
      }

      const response = await fetch("/api/study-agents/enroll-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          courseId,
          examDate: examDate || null,
          apiKey: apiKey, // Enviar API key si está disponible para generar resúmenes automáticamente
        }),
      });

      if (response.ok) {
        await loadData();
        await loadWallet(); // Recargar wallet después de comprar
        setActiveTab("my-courses");
        setNotification({
          message: "¡Te has inscrito correctamente en el curso!",
          type: "success"
        });
      } else {
        const errorData = await response.json();
        
        // Si es error de saldo insuficiente (402), mostrar modal de wallet
        if (response.status === 402) {
          setShowWalletModal(true);
          setNotification({
            message: errorData.error || "Saldo insuficiente. Por favor, recarga tu wallet.",
            type: "error"
          });
        } else {
          setNotification({
            message: errorData.error || "Error al inscribirse en el curso",
            type: "error"
          });
        }
      }
    } catch (error) {
      console.error("Error inscribiéndose:", error);
      setNotification({
        message: "Error al inscribirse en el curso. Por favor, inténtalo de nuevo.",
        type: "error"
      });
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        background: "#0a0a0f"
      }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "2px solid rgba(99, 102, 241, 0.2)",
            borderTop: "2px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh",
      background: "var(--bg-primary)",
      padding: "0"
    }}>
      {/* Hero Section - Minimalista */}
      <div style={{
        padding: "6rem 2rem 4rem",
        maxWidth: "1400px",
        margin: "0 auto",
        textAlign: "center"
      }}>
        <h1 style={{ 
          fontSize: "clamp(2.5rem, 5vw, 4.5rem)", 
          fontWeight: "700", 
          marginBottom: "1.5rem",
          color: "var(--text-primary)",
          letterSpacing: "-0.03em",
          lineHeight: "1.1"
        }}>
          Study Agents
        </h1>
        <p style={{ 
          color: "var(--text-secondary)", 
          fontSize: "1.15rem", 
          fontWeight: "400",
          maxWidth: "600px",
          margin: "0 auto 1rem"
        }}>
          Prepara tus exámenes y mejora tus habilidades con cursos personalizados
        </p>
        
        {/* Wallet Balance */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          margin: "0 auto 1.5rem",
          padding: "1rem 1.5rem",
          background: "var(--bg-card)",
          borderRadius: "16px",
          border: "1px solid var(--border-overlay-1)",
          cursor: "pointer",
          transition: "all 0.2s",
          maxWidth: "300px",
        }}
        onClick={() => setShowWalletModal(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
          e.currentTarget.style.background = "var(--bg-overlay-04)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-overlay-1)";
          e.currentTarget.style.background = "var(--bg-card)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "rgba(99, 102, 241, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}>
            <TbCoins size={24} color="#6366f1" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, marginBottom: "0.25rem" }}>
              Saldo disponible
            </p>
            <p style={{ fontSize: "1.25rem", fontWeight: "700", color: "#6366f1", margin: 0 }}>
              {walletBalance.toFixed(2)}€
            </p>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>
            →
          </div>
        </div>
        
        {/* Buscador - Siempre visible */}
        <div style={{
          maxWidth: "500px",
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
            <HiMagnifyingGlass 
              style={{
                color: "#6366f1",
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginRight: "1rem",
                flexShrink: 0
              }}
            />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div style={{ 
        maxWidth: "1400px", 
        margin: "0 auto", 
        padding: "0 2rem 4rem"
      }}>
        {/* Tabs - Minimalistas con animaciones */}
        <div style={{ 
          display: "flex", 
          gap: "0.75rem", 
          marginBottom: "3rem",
          marginTop: "0 rem",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => {
              setActiveTab("my-courses");
              setSearchQuery("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 1.75rem",
              background: activeTab === "my-courses" 
                ? "rgba(99, 102, 241, 0.1)" 
                : "var(--bg-card)",
              border: activeTab === "my-courses" 
                ? "3px solid #6366f1" 
                : "3px solid var(--border-overlay-1)",
              color: activeTab === "my-courses" ? "#6366f1" : "var(--text-primary)",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "700",
              borderRadius: "50px",
              transition: "all 0.3s ease",
              boxShadow: activeTab === "my-courses" 
                ? "0 4px 12px rgba(99, 102, 241, 0.2)" 
                : "0 4px 12px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "my-courses") {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.25)";
                e.currentTarget.style.transform = "translateY(-2px)";
              } else {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = activeTab === "my-courses" 
                ? "0 4px 12px rgba(99, 102, 241, 0.2)" 
                : "0 4px 12px rgba(0, 0, 0, 0.08)";
              if (activeTab !== "my-courses") {
                e.currentTarget.style.borderColor = "var(--border-overlay-1)";
              }
            }}
          >
            <HiBookOpen style={{ fontSize: "1.2rem" }} />
            <span>
              Mis Cursos {enrollments.length > 0 && <span style={{ fontWeight: "400", opacity: 0.7 }}>({enrollments.length})</span>}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("all-courses")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 1.75rem",
              background: activeTab === "all-courses" 
                ? "rgba(99, 102, 241, 0.1)" 
                : "var(--bg-card)",
              border: activeTab === "all-courses" 
                ? "3px solid #6366f1" 
                : "3px solid var(--border-overlay-1)",
              color: activeTab === "all-courses" ? "#6366f1" : "var(--text-primary)",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "700",
              borderRadius: "50px",
              transition: "all 0.3s ease",
              boxShadow: activeTab === "all-courses" 
                ? "0 4px 12px rgba(99, 102, 241, 0.2)" 
                : "0 4px 12px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "all-courses") {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.25)";
                e.currentTarget.style.transform = "translateY(-2px)";
              } else {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = activeTab === "all-courses" 
                ? "0 4px 12px rgba(99, 102, 241, 0.2)" 
                : "0 4px 12px rgba(0, 0, 0, 0.08)";
              if (activeTab !== "all-courses") {
                e.currentTarget.style.borderColor = "var(--border-overlay-1)";
              }
            }}
          >
            <HiSparkles style={{ fontSize: "1.2rem" }} />
            <span>
              Explorar {allCourses.length > 0 && <span style={{ fontWeight: "400", opacity: 0.7 }}>({allCourses.length})</span>}
            </span>
          </button>
          <Link
            href="/study-agents/create-course"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: "#6366f1",
              color: "white",
              borderRadius: "50px",
              textDecoration: "none",
              fontWeight: "500",
              fontSize: "0.95rem",
              border: "3px solid #6366f1",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#7c3aed";
              e.currentTarget.style.borderColor = "#7c3aed";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#6366f1";
              e.currentTarget.style.borderColor = "#6366f1";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
            }}
          >
            <HiPlus style={{ fontSize: "1.1rem", opacity: 0.9 }} /> 
            <span>Crear Curso</span>
          </Link>
          <style jsx>{`
            @keyframes shimmer {
              0% { left: -100%; }
              100% { left: 100%; }
            }
          `}</style>
        </div>

        {/* Content */}
        {activeTab === "my-courses" ? (
          <div>
            {enrollments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "6rem 2rem",
                  background: "var(--bg-overlay-02)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-overlay-05)",
                }}
              >
                <HiAcademicCap size={64} style={{ margin: "0 auto 1.5rem", color: "var(--text-muted)" }} />
                <p style={{ fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "0.75rem", fontWeight: "500" }}>
                  Aún no estás inscrito en ningún curso
                </p>
                <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "1rem" }}>
                  Explora los cursos disponibles o crea uno nuevo
                </p>
                <button
                  onClick={() => setActiveTab("all-courses")}
                  style={{
                    padding: "0.875rem 2rem",
                    background: "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "700",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#7c3aed";
                    e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(99, 102, 241, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#6366f1";
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px) scale(1.02)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
                  }}
                >
                  Explorar Cursos
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "2rem" }}>
                {enrollments
                  .filter(({ course }) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      course.title.toLowerCase().includes(query) ||
                      course.description.toLowerCase().includes(query) ||
                      course.topics.some((topic) => topic.name.toLowerCase().includes(query))
                    );
                  })
                  .map(({ course, enrollment }, index) => {
                  // Calcular días restantes: priorizar exam_date, luego end_date, luego max_duration_days
                  let daysUntil = null;
                  if (enrollment.exam_date) {
                    daysUntil = getDaysUntil(enrollment.exam_date);
                  } else if (enrollment.end_date) {
                    daysUntil = getDaysUntil(enrollment.end_date);
                  } else if (course.max_duration_days && enrollment.enrolled_at) {
                    // Calcular basado en max_duration_days desde enrolled_at
                    const enrolledDate = new Date(enrollment.enrolled_at);
                    const endDate = new Date(enrolledDate);
                    endDate.setDate(endDate.getDate() + course.max_duration_days);
                    daysUntil = getDaysUntil(endDate.toISOString());
                  }
                  const avgProgress = Object.values(enrollment.topic_progress).reduce((a, b) => a + b, 0) / 
                    (Object.keys(enrollment.topic_progress).length || 1);

                  return (
                    <Link
                      key={course.course_id}
                      href={`/study-agents/course/${course.course_id}`}
                      style={{
                        display: "block",
                        background: "var(--bg-card)",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "1px solid var(--border-overlay-1)",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        position: "relative",
                        padding: "2rem",
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
                      {/* Portada del Curso */}
                      {course.cover_image ? (
                        <div style={{
                          width: "100%",
                          height: "200px",
                          marginBottom: "1.5rem",
                          borderRadius: "12px",
                          overflow: "hidden",
                          position: "relative",
                          background: "var(--bg-overlay-02)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}>
                          <img
                            src={course.cover_image}
                            alt={course.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div style="
                                    width: 100%;
                                    height: 100%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
                                  ">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                      <path d="M2 17L12 22L22 17" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                      <path d="M2 12L12 17L22 12" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                      ) : (
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
                          <HiAcademicCap size={32} color="#6366f1" />
                        </div>
                      )}

                      {/* Título y Universidad */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <h3 style={{ 
                          fontSize: "1.5rem", 
                          fontWeight: "600", 
                          marginBottom: (course.institution || course.subject) ? "0.5rem" : "0",
                          color: "var(--text-primary)",
                          lineHeight: "1.3"
                        }}>
                          {course.title}
                        </h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                          {course.institution && (
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.5rem 0.75rem",
                              background: "var(--bg-overlay-02)",
                              borderRadius: "8px",
                              border: "1px solid var(--border-overlay-1)",
                              width: "fit-content",
                            }}>
                              {course.institution.logo && (
                                <img
                                  src={course.institution.logo}
                                  alt={course.institution.name}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    objectFit: "contain",
                                    borderRadius: "4px",
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              )}
                              <span style={{
                                fontSize: "0.8rem",
                                color: "var(--text-secondary)",
                                fontWeight: "500",
                              }}>
                                {course.institution.name}
                              </span>
                            </div>
                          )}
                          {course.subject && (
                            <div style={{
                              padding: "0.5rem 0.75rem",
                              background: "rgba(99, 102, 241, 0.1)",
                              borderRadius: "8px",
                              border: "1px solid rgba(99, 102, 241, 0.2)",
                              width: "fit-content",
                            }}>
                              <span style={{
                                fontSize: "0.8rem",
                                color: "#6366f1",
                                fontWeight: "600",
                              }}>
                                {course.subject}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Descripción */}
                      <p style={{ 
                        color: "var(--text-secondary)", 
                        fontSize: "0.95rem", 
                        marginBottom: "1.5rem", 
                        lineHeight: "1.6",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {course.description}
                      </p>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: "1.5rem" }}>
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          marginBottom: "0.5rem",
                          fontSize: "0.85rem"
                        }}>
                          <span style={{ color: "var(--text-muted)" }}>Progreso</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                            {Math.round(avgProgress)}%
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
                              width: `${avgProgress}%`,
                              height: "100%",
                              background: "#6366f1",
                              borderRadius: "4px",
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ 
                        display: "flex", 
                        gap: "1.5rem",
                        marginBottom: "1.5rem",
                        paddingTop: "1.5rem",
                        borderTop: "1px solid var(--border-overlay-05)",
                        fontSize: "0.85rem",
                        flexWrap: "wrap"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                          <TbTrophy size={16} color="#6366f1" />
                          <span>{enrollment.xp} XP</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                          <TbCoins size={16} color="#6366f1" />
                          <span>{enrollment.credits_remaining}</span>
                        </div>
                        {course.satisfaction_rating && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                            <HiStar size={16} color="#FFD700" style={{ fill: "#FFD700" }} />
                            <span style={{ color: "#FFD700", fontWeight: "600" }}>
                              {course.satisfaction_rating.toFixed(1)}
                            </span>
                            {course.satisfaction_count > 0 && (
                              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                ({course.satisfaction_count})
                              </span>
                            )}
                          </div>
                        )}
                        {daysUntil !== null && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                            <HiClock size={16} color={daysUntil < 7 ? "#ef4444" : daysUntil < 30 ? "#f59e0b" : "#10b981"} />
                            <span style={{ color: daysUntil < 7 ? "#ef4444" : daysUntil < 30 ? "#f59e0b" : "#10b981" }}>
                              {daysUntil > 0 ? `${daysUntil}d` : "Finalizado"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botones */}
                      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                        <button
                          onClick={async () => {
                            setSelectedCourseDetails(course);
                            setLoadingReviews(true);
                            try {
                              const response = await fetch("/api/study-agents/get-course-reviews", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ courseId: course.course_id }),
                              });
                              if (response.ok) {
                                const data = await response.json();
                                setCourseReviews(data.reviews || []);
                              }
                            } catch (error) {
                              console.error("Error cargando reviews:", error);
                            } finally {
                              setLoadingReviews(false);
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: "0.875rem",
                            background: "transparent",
                            color: "#6366f1",
                            border: "2px solid #6366f1",
                            borderRadius: "10px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          Ver Detalles
                        </button>
                        <Link
                          href={`/study-agents/course/${course.course_id}`}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            padding: "0.875rem",
                            background: "#6366f1",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            textDecoration: "none",
                            fontWeight: "700",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#7c3aed";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#6366f1";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          Entrar
                          <HiArrowRight size={18} />
                        </Link>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {allCourses.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "6rem 2rem",
                  background: "var(--bg-overlay-02)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-overlay-05)",
                }}
              >
                <HiAcademicCap size={64} style={{ margin: "0 auto 1.5rem", color: "var(--text-muted)" }} />
                <p style={{ fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "0.75rem", fontWeight: "500" }}>
                  No hay cursos disponibles
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
                  Sé el primero en crear un curso
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "2rem" }}>
                {allCourses
                  .filter((course) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      course.title.toLowerCase().includes(query) ||
                      course.description.toLowerCase().includes(query) ||
                      course.topics.some((topic) => topic.name.toLowerCase().includes(query))
                    );
                  })
                  .map((course, index) => {
                  const isEnrolled = enrollments.some((e) => e.course.course_id === course.course_id);

                  return (
                    <div
                      key={course.course_id}
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "1px solid var(--border-overlay-1)",
                        transition: "all 0.3s ease",
                        position: "relative",
                        padding: "2rem",
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
                      {/* Portada del Curso */}
                      {course.cover_image ? (
                        <div style={{
                          width: "100%",
                          height: "200px",
                          marginBottom: "1.5rem",
                          borderRadius: "12px",
                          overflow: "hidden",
                          position: "relative",
                          background: "var(--bg-overlay-02)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}>
                          <img
                            src={course.cover_image}
                            alt={course.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div style="
                                    width: 100%;
                                    height: 100%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
                                  ">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                      <path d="M2 17L12 22L22 17" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                      <path d="M2 12L12 17L22 12" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                      ) : (
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
                          <HiAcademicCap size={32} color="#6366f1" />
                        </div>
                      )}

                      {/* Título y Universidad */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <h3 style={{ 
                          fontSize: "1.5rem", 
                          fontWeight: "600", 
                          marginBottom: (course.institution || course.subject) ? "0.5rem" : "0",
                          color: "var(--text-primary)",
                          lineHeight: "1.3"
                        }}>
                          {course.title}
                        </h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                          {course.institution && (
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.5rem 0.75rem",
                              background: "var(--bg-overlay-02)",
                              borderRadius: "8px",
                              border: "1px solid var(--border-overlay-1)",
                              width: "fit-content",
                            }}>
                              {course.institution.logo && (
                                <img
                                  src={course.institution.logo}
                                  alt={course.institution.name}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    objectFit: "contain",
                                    borderRadius: "4px",
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              )}
                              <span style={{
                                fontSize: "0.8rem",
                                color: "var(--text-secondary)",
                                fontWeight: "500",
                              }}>
                                {course.institution.name}
                              </span>
                            </div>
                          )}
                          {course.subject && (
                            <div style={{
                              padding: "0.5rem 0.75rem",
                              background: "rgba(99, 102, 241, 0.1)",
                              borderRadius: "8px",
                              border: "1px solid rgba(99, 102, 241, 0.2)",
                              width: "fit-content",
                            }}>
                              <span style={{
                                fontSize: "0.8rem",
                                color: "#6366f1",
                                fontWeight: "600",
                              }}>
                                {course.subject}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Descripción */}
                      <p style={{ 
                        color: "var(--text-secondary)", 
                        fontSize: "0.95rem", 
                        marginBottom: "1.5rem", 
                        lineHeight: "1.6",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {course.description}
                      </p>

                      {/* Stats */}
                      <div style={{ 
                        display: "flex", 
                        gap: "1.5rem",
                        marginBottom: "1.5rem",
                        paddingBottom: "1.5rem",
                        borderBottom: "1px solid var(--border-overlay-1)",
                        fontSize: "0.85rem"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                          <HiUserGroup size={16} color="#6366f1" />
                          <span>{course.enrollment_count}</span>
                        </div>
                        {course.satisfaction_rating && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                            <HiStar size={16} color="#FFD700" style={{ fill: "#FFD700" }} />
                            <span style={{ color: "#FFD700", fontWeight: "600" }}>
                              {course.satisfaction_rating.toFixed(1)}
                            </span>
                            {course.satisfaction_count > 0 && (
                              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                ({course.satisfaction_count})
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ 
                          marginLeft: "auto",
                          padding: "0.25rem 0.75rem",
                          background: course.price === 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                          color: course.price === 0 ? "#10b981" : "#6366f1",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: "600"
                        }}>
                          {formatPrice(course.price)}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          onClick={async () => {
                            setSelectedCourseDetails(course);
                            setLoadingReviews(true);
                            try {
                              const response = await fetch("/api/study-agents/get-course-reviews", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ courseId: course.course_id }),
                              });
                              if (response.ok) {
                                const data = await response.json();
                                setCourseReviews(data.reviews || []);
                              }
                            } catch (error) {
                              console.error("Error cargando reviews:", error);
                            } finally {
                              setLoadingReviews(false);
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: "0.875rem",
                            background: "transparent",
                            color: "#6366f1",
                            border: "2px solid #6366f1",
                            borderRadius: "10px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          Ver Detalles
                        </button>
                        {isEnrolled ? (
                          <Link
                            href={`/study-agents/course/${course.course_id}`}
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.5rem",
                              padding: "0.875rem",
                              background: "#6366f1",
                              color: "white",
                              border: "none",
                              borderRadius: "10px",
                              textDecoration: "none",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontSize: "0.95rem",
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#7c3aed";
                              e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                              e.currentTarget.style.boxShadow = "0 8px 25px rgba(99, 102, 241, 0.4)";
                              const arrow = e.currentTarget.querySelector('svg');
                              if (arrow) arrow.style.transform = "translateX(4px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#6366f1";
                              e.currentTarget.style.transform = "translateY(0) scale(1)";
                              e.currentTarget.style.boxShadow = "none";
                              const arrow = e.currentTarget.querySelector('svg');
                              if (arrow) arrow.style.transform = "translateX(0)";
                            }}
                          >
                            Entrar
                            <HiArrowRight size={18} style={{ transition: "transform 0.3s ease" }} />
                          </Link>
                        ) : (
                          <button
                            onClick={() => {
                              const coursePrice = course.price || 0;
                              
                              if (coursePrice > 0 && walletBalance < coursePrice) {
                                setShowWalletModal(true);
                                setNotification({
                                  message: `Saldo insuficiente. Necesitas ${coursePrice.toFixed(2)}€. Tu saldo actual: ${walletBalance.toFixed(2)}€.`,
                                  type: "error"
                                });
                                return;
                              }
                              
                              if (course.is_exam) {
                                setSelectedCourseForEnrollment(course.course_id);
                                setShowExamDateModal(true);
                              } else {
                                handleEnroll(course.course_id, null);
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: "0.875rem",
                              background: course.price === 0 
                                ? "#10b981" 
                                : "#6366f1",
                              color: "white",
                              border: "none",
                              borderRadius: "10px",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontSize: "0.95rem",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = course.price === 0 ? "#059669" : "#7c3aed";
                              e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = course.price === 0 ? "#10b981" : "#6366f1";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            {course.price === 0 ? "Gratis" : formatPrice(course.price)}
                          </button>
                        )}
      </div>

      {/* Modal de Detalles del Curso */}
      {selectedCourseDetails && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            overflow: "auto",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCourseDetails(null);
              setCourseReviews([]);
            }
          }}
        >
          <div
            style={{
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              background: "var(--bg-card)",
              borderRadius: "24px",
              border: "1px solid var(--border-overlay-1)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: "2rem",
              borderBottom: "1px solid var(--border-overlay-1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)"
            }}>
              <h2 style={{ fontSize: "1.75rem", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>
                {selectedCourseDetails.title}
              </h2>
              <button
                onClick={() => {
                  setSelectedCourseDetails(null);
                  setCourseReviews([]);
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

            {/* Content */}
            <div style={{ padding: "2rem" }}>
              {/* Portada */}
              {selectedCourseDetails.cover_image && (
                <div style={{
                  width: "100%",
                  height: "300px",
                  marginBottom: "2rem",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "var(--bg-overlay-02)",
                }}>
                  <img
                    src={selectedCourseDetails.cover_image}
                    alt={selectedCourseDetails.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}

              {/* Descripción */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem", color: "var(--text-primary)" }}>
                  Descripción
                </h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: "1.7", fontSize: "1rem" }}>
                  {selectedCourseDetails.description}
                </p>
              </div>

              {/* Temas */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem", color: "var(--text-primary)" }}>
                  Temas ({selectedCourseDetails.topics?.length || 0})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {selectedCourseDetails.topics?.map((topic, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "1rem 1.25rem",
                        background: "var(--bg-overlay-02)",
                        borderRadius: "12px",
                        border: "1px solid var(--border-overlay-1)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "rgba(99, 102, 241, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <HiBookOpen size={18} color="#6366f1" />
                        </div>
                        <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                          {topic.name}
                        </span>
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <span style={{ marginLeft: "auto", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            {topic.subtopics.length} subtemas
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem", color: "var(--text-primary)" }}>
                  Reviews
                  {selectedCourseDetails.satisfaction_rating && (
                    <span style={{ marginLeft: "0.75rem", fontSize: "1rem", fontWeight: "500", color: "var(--text-secondary)" }}>
                      ({selectedCourseDetails.satisfaction_rating.toFixed(1)} ⭐ - {selectedCourseDetails.satisfaction_count} {selectedCourseDetails.satisfaction_count === 1 ? "review" : "reviews"})
                    </span>
                  )}
                </h3>
                {loadingReviews ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                    Cargando reviews...
                  </div>
                ) : courseReviews.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                    <HiStar size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>Aún no hay reviews para este curso</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "400px", overflow: "auto" }}>
                    {courseReviews.map((review, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "1.25rem",
                          background: "var(--bg-overlay-02)",
                          borderRadius: "12px",
                          border: "1px solid var(--border-overlay-1)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <HiStar
                                key={star}
                                size={18}
                                color={star <= review.rating ? "#FFD700" : "var(--text-muted)"}
                                style={{ fill: star <= review.rating ? "#FFD700" : "transparent" }}
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                            {new Date(review.created_at).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                        {review.comment && (
                          <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: "1.6", fontSize: "0.95rem" }}>
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
})}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para fecha de examen */}
      {showExamDateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowExamDateModal(false);
              setSelectedCourseForEnrollment(null);
              setExamDateInput("");
            }
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "700px",
              width: "100%",
              border: "1px solid var(--border-overlay-1)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              fontSize: "1.5rem", 
              fontWeight: "600", 
              marginBottom: "1rem",
              color: "var(--text-primary)"
            }}>
              Fecha del Examen
            </h3>
            <p style={{ 
              color: "var(--text-secondary)", 
              marginBottom: "1.5rem",
              fontSize: "0.95rem"
            }}>
              Por favor, indica la fecha de tu examen para poder guiarte mejor en tu preparación.
            </p>
            
            {/* Calendario Visual */}
            <div style={{ marginBottom: "1.5rem" }}>
              {/* Navegación del mes */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "1.5rem" 
              }}>
                <button
                  onClick={() => {
                    const prevMonth = new Date(calendarMonth);
                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                    setCalendarMonth(prevMonth);
                  }}
                  style={{
                    padding: "0.75rem",
                    background: "var(--bg-card)",
                    border: "3px solid var(--border-overlay-1)",
                    borderRadius: "50px",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
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
                  <HiChevronLeft size={20} style={{ fontWeight: "bold" }} />
                </button>
                <h4 style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: "700", 
                  color: "var(--text-primary)",
                  textTransform: "capitalize"
                }}>
                  {calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h4>
                <button
                  onClick={() => {
                    const nextMonth = new Date(calendarMonth);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setCalendarMonth(nextMonth);
                  }}
                  style={{
                    padding: "0.75rem",
                    background: "var(--bg-card)",
                    border: "3px solid var(--border-overlay-1)",
                    borderRadius: "50px",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
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
                  <HiChevronRight size={20} style={{ fontWeight: "bold" }} />
                </button>
              </div>

              {/* Días de la semana */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(7, 1fr)", 
                gap: "0.5rem",
                marginBottom: "0.75rem"
              }}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                  <div key={day} style={{ 
                    textAlign: "center", 
                    fontSize: "0.9rem", 
                    fontWeight: "700",
                    color: "var(--text-muted)",
                    padding: "0.75rem 0"
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(7, 1fr)", 
                gap: "0.5rem"
              }}>
                {(() => {
                  const year = calendarMonth.getFullYear();
                  const month = calendarMonth.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const daysInMonth = lastDay.getDate();
                  const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Lunes = 0
                  
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const days = [];
                  
                  // Días vacíos al inicio
                  for (let i = 0; i < startingDayOfWeek; i++) {
                    days.push(null);
                  }
                  
                  // Días del mes
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    days.push(date);
                  }
                  
                  return days.map((date, index) => {
                    if (!date) {
                      return <div key={index} />;
                    }
                    
                    const isPast = date < today;
                    const isSelected = selectedDate && 
                      date.getDate() === selectedDate.getDate() &&
                      date.getMonth() === selectedDate.getMonth() &&
                      date.getFullYear() === selectedDate.getFullYear();
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (!isPast) {
                            setSelectedDate(date);
                            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            setExamDateInput(formattedDate);
                          }
                        }}
                        disabled={isPast}
                        style={{
                          padding: "1rem 0.5rem",
                          background: isSelected 
                            ? "#6366f1" 
                            : isPast 
                            ? "transparent" 
                            : "var(--bg-card)",
                          border: isSelected 
                            ? "3px solid #6366f1" 
                            : isPast 
                            ? "3px solid transparent" 
                            : "3px solid var(--border-overlay-1)",
                          borderRadius: "50px",
                          color: isSelected 
                            ? "white" 
                            : isPast 
                            ? "var(--text-muted)" 
                            : "var(--text-primary)",
                          cursor: isPast ? "not-allowed" : "pointer",
                          fontSize: "1rem",
                          fontWeight: "700",
                          transition: "all 0.3s ease",
                          opacity: isPast ? 0.4 : 1,
                          boxShadow: isSelected 
                            ? "0 4px 12px rgba(99, 102, 241, 0.3)" 
                            : isPast 
                            ? "none" 
                            : "0 2px 8px rgba(0, 0, 0, 0.04)",
                        }}
                        onMouseEnter={(e) => {
                          if (!isPast && !isSelected) {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                            e.currentTarget.style.borderColor = "#6366f1";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.2)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isPast && !isSelected) {
                            e.currentTarget.style.background = "var(--bg-card)";
                            e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.04)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                      >
                        {date.getDate()}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowExamDateModal(false);
                  setSelectedCourseForEnrollment(null);
                  setExamDateInput("");
                  setSelectedDate(null);
                  setCalendarMonth(new Date());
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.875rem 1.75rem",
                  background: "var(--bg-card)",
                  border: "3px solid var(--border-overlay-1)",
                  borderRadius: "50px",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "700",
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
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedCourseForEnrollment) {
                    // Verificar saldo antes de inscribir
                    const course = allCourses.find(c => c.course_id === selectedCourseForEnrollment);
                    const coursePrice = course?.price || 0;
                    
                    if (coursePrice > 0 && walletBalance < coursePrice) {
                      // No hay saldo suficiente, cerrar modal de fecha y mostrar wallet
                      setShowExamDateModal(false);
                      setSelectedCourseForEnrollment(null);
                      setExamDateInput("");
                      setSelectedDate(null);
                      setCalendarMonth(new Date());
                      setShowWalletModal(true);
                      setNotification({
                        message: `Saldo insuficiente. Necesitas ${coursePrice.toFixed(2)}€. Tu saldo actual: ${walletBalance.toFixed(2)}€.`,
                        type: "error"
                      });
                      return;
                    }
                    
                    handleEnroll(selectedCourseForEnrollment, examDateInput || null);
                    setShowExamDateModal(false);
                    setSelectedCourseForEnrollment(null);
                    setExamDateInput("");
                    setSelectedDate(null);
                    setCalendarMonth(new Date());
                  }
                }}
                disabled={!selectedDate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.875rem 1.75rem",
                  background: selectedDate 
                    ? "rgba(99, 102, 241, 0.1)" 
                    : "var(--bg-card)",
                  border: selectedDate 
                    ? "3px solid #6366f1" 
                    : "3px solid var(--border-overlay-1)",
                  borderRadius: "50px",
                  color: selectedDate ? "#6366f1" : "var(--text-muted)",
                  cursor: selectedDate ? "pointer" : "not-allowed",
                  fontSize: "1rem",
                  fontWeight: "700",
                  transition: "all 0.3s ease",
                  boxShadow: selectedDate 
                    ? "0 4px 12px rgba(99, 102, 241, 0.2)" 
                    : "0 4px 12px rgba(0, 0, 0, 0.08)",
                  opacity: selectedDate ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (selectedDate) {
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.3)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDate) {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.2)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                Inscribirse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Wallet */}
      {showWalletModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: isMobile ? "0" : "2rem",
            overflowY: "auto",
          }}
          onClick={() => {
            setShowWalletModal(false);
            setRechargeAmount(null);
            setPaymentMethod(null);
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: isMobile ? "0" : "20px",
              padding: isMobile ? "1.5rem" : isTablet ? "2rem" : "2.5rem",
              maxWidth: "500px",
              width: "100%",
              maxHeight: isMobile ? "100vh" : "90vh",
              border: "1px solid var(--border-overlay-1)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: isMobile ? "flex-start" : "center", 
              marginBottom: isMobile ? "1.5rem" : "2.5rem",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "1rem" : "0",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: isMobile ? "0.5rem" : "0.75rem",
                flex: 1,
              }}>
                <div style={{
                  width: isMobile ? "40px" : "48px",
                  height: isMobile ? "40px" : "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  flexShrink: 0,
                }}>
                  <TbWallet size={isMobile ? 20 : 24} color="#6366f1" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ 
                    fontSize: isMobile ? "1.5rem" : "1.75rem", 
                    fontWeight: "700", 
                    color: "var(--text-primary)", 
                    margin: 0, 
                    lineHeight: "1.2" 
                  }}>
                    Wallet
                  </h2>
                  <p style={{ 
                    fontSize: isMobile ? "0.75rem" : "0.875rem", 
                    color: "var(--text-secondary)", 
                    margin: 0, 
                    marginTop: "0.25rem" 
                  }}>
                    Gestiona tu saldo y recargas
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWalletModal(false);
                  setRechargeAmount(null);
                  setPaymentMethod(null);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-overlay-05)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <HiXMark size={24} />
              </button>
            </div>

            <div style={{ marginBottom: isMobile ? "1.5rem" : "2.5rem" }}>
              <div style={{ 
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)", 
                borderRadius: isMobile ? "12px" : "16px", 
                padding: isMobile ? "1.25rem" : "2rem",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                marginBottom: isMobile ? "1.25rem" : "2rem",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute",
                  top: "-50%",
                  right: "-50%",
                  width: "200%",
                  height: "200%",
                  background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.75rem", margin: 0, fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Saldo disponible
                    </p>
                    <p style={{ fontSize: "2.75rem", fontWeight: "800", color: "#6366f1", margin: 0, lineHeight: "1" }}>
                      {walletBalance.toFixed(2)}€
                    </p>
                  </div>
                  <div style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    background: "rgba(99, 102, 241, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                  }}>
                    <TbCoins size={32} color="#6366f1" />
                  </div>
                </div>
              </div>

              {/* Paso 1: Seleccionar Cantidad */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: isMobile ? "0.5rem" : "0.75rem", 
                marginBottom: isMobile ? "1rem" : "1.25rem",
                flexWrap: isMobile ? "wrap" : "nowrap",
              }}>
                <div style={{
                  width: isMobile ? "24px" : "28px",
                  height: isMobile ? "24px" : "28px",
                  borderRadius: "8px",
                  background: rechargeAmount ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "var(--bg-overlay-05)",
                  border: rechargeAmount ? "none" : "1px solid var(--border-overlay-1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: rechargeAmount ? "white" : "var(--text-muted)",
                  fontWeight: "700",
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                  flexShrink: 0,
                }}>
                  {rechargeAmount ? <HiCheckCircle size={isMobile ? 16 : 18} /> : "1"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontSize: isMobile ? "0.9rem" : "1rem", 
                    color: "var(--text-primary)", 
                    margin: 0, 
                    fontWeight: "600" 
                  }}>
                    Selecciona la cantidad
                  </p>
                  <p style={{ 
                    fontSize: isMobile ? "0.75rem" : "0.8125rem", 
                    color: "var(--text-secondary)", 
                    margin: "0.25rem 0 0 0" 
                  }}>
                    Elige cuánto quieres recargar
                  </p>
                </div>
              </div>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", 
                gap: isMobile ? "0.75rem" : "0.875rem",
                marginBottom: isMobile ? "1.5rem" : "2rem"
              }}>
                {[10, 20, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setRechargeAmount(amount)}
                    disabled={loadingWallet}
                    style={{
                      padding: isMobile ? "1rem 0.75rem" : "1.25rem 1rem",
                      background: rechargeAmount === amount 
                        ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" 
                        : "var(--bg-card)",
                      color: rechargeAmount === amount ? "white" : "var(--text-primary)",
                      border: rechargeAmount === amount 
                        ? "2px solid #6366f1" 
                        : "2px solid var(--border-overlay-1)",
                      borderRadius: isMobile ? "12px" : "14px",
                      cursor: loadingWallet ? "not-allowed" : "pointer",
                      fontWeight: "700",
                      fontSize: isMobile ? "1rem" : "1.1rem",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      opacity: loadingWallet ? 0.6 : 1,
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: rechargeAmount === amount 
                        ? "0 4px 15px rgba(99, 102, 241, 0.3)" 
                        : "0 2px 8px rgba(0, 0, 0, 0.05)",
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingWallet && rechargeAmount !== amount) {
                        e.currentTarget.style.background = "var(--bg-overlay-08)";
                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                      } else if (!loadingWallet && rechargeAmount === amount) {
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingWallet && rechargeAmount !== amount) {
                        e.currentTarget.style.background = "var(--bg-card)";
                        e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                      } else if (!loadingWallet && rechargeAmount === amount) {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.3)";
                      }
                    }}
                  >
                    {rechargeAmount === amount && (
                      <div style={{
                        position: "absolute",
                        top: "-50%",
                        right: "-50%",
                        width: "200%",
                        height: "200%",
                        background: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
                        pointerEvents: "none",
                      }} />
                    )}
                    <span style={{ position: "relative", zIndex: 1 }}>
                      {amount}€
                    </span>
                  </button>
                ))}
              </div>

              {/* Paso 2: Seleccionar Método de Pago */}
              {rechargeAmount && (
                <>
                  <div style={{ 
                    height: "1px", 
                    background: "var(--border-overlay-1)", 
                    margin: "2rem 0",
                    opacity: 0.5
                  }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: paymentMethod ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "var(--bg-overlay-05)",
                      border: paymentMethod ? "none" : "1px solid var(--border-overlay-1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: paymentMethod ? "white" : "var(--text-muted)",
                      fontWeight: "700",
                      fontSize: "0.875rem",
                      flexShrink: 0,
                    }}>
                      {paymentMethod ? <HiCheckCircle size={18} /> : "2"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "1rem", color: "var(--text-primary)", margin: 0, fontWeight: "600" }}>
                        Selecciona el método de pago
                      </p>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>
                        Elige cómo quieres pagar
                      </p>
                    </div>
                  </div>
                  <div style={{ 
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    marginBottom: "2rem"
                  }}>
                    <button
                      onClick={() => setPaymentMethod("card")}
                      disabled={loadingWallet}
                      style={{
                        padding: "1.25rem 1.5rem",
                        background: paymentMethod === "card" 
                          ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" 
                          : "var(--bg-overlay-05)",
                        color: paymentMethod === "card" ? "white" : "var(--text-primary)",
                        border: paymentMethod === "card" 
                          ? "2px solid #6366f1" 
                          : "2px solid var(--border-overlay-1)",
                        borderRadius: "12px",
                        cursor: loadingWallet ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        opacity: loadingWallet ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingWallet && paymentMethod !== "card") {
                          e.currentTarget.style.background = "var(--bg-overlay-08)";
                          e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loadingWallet && paymentMethod !== "card") {
                          e.currentTarget.style.background = "var(--bg-overlay-05)";
                          e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }
                      }}
                    >
                      <div style={{
                        width: isMobile ? "36px" : "40px",
                        height: isMobile ? "36px" : "40px",
                        borderRadius: isMobile ? "8px" : "10px",
                        background: paymentMethod === "card" 
                          ? "rgba(255, 255, 255, 0.2)" 
                          : "rgba(99, 102, 241, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: paymentMethod === "card" 
                          ? "1px solid rgba(255, 255, 255, 0.3)" 
                          : "1px solid rgba(99, 102, 241, 0.2)",
                        flexShrink: 0,
                      }}>
                        <HiCreditCard size={isMobile ? 18 : 20} color={paymentMethod === "card" ? "white" : "#6366f1"} />
                      </div>
                      <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "0.5rem", 
                          marginBottom: "0.25rem",
                          flexWrap: "wrap",
                        }}>
                          <span style={{ 
                            fontSize: isMobile ? "0.875rem" : "1rem", 
                            fontWeight: "600" 
                          }}>
                            Tarjeta de crédito/débito
                          </span>
                          {paymentMethod === "card" && (
                            <HiShieldCheck size={isMobile ? 16 : 18} color="white" style={{ opacity: 0.9 }} />
                          )}
                        </div>
                        <span style={{ 
                          fontSize: isMobile ? "0.75rem" : "0.8125rem", 
                          opacity: paymentMethod === "card" ? 0.9 : 0.7 
                        }}>
                          Pago seguro con Stripe
                        </span>
                      </div>
                      {paymentMethod === "card" && (
                        <HiCheckCircle size={isMobile ? 18 : 20} color="white" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Paso 3: Botón de Pagar */}
              {rechargeAmount && paymentMethod && (
                <>
                  <div style={{ 
                    height: "1px", 
                    background: "var(--border-overlay-1)", 
                    margin: "2rem 0",
                    opacity: 0.5
                  }} />
                  <div style={{
                    background: "var(--bg-overlay-05)",
                    borderRadius: "12px",
                    padding: "1rem",
                    marginBottom: "1rem",
                    border: "1px solid var(--border-overlay-1)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: "500" }}>
                        Total a pagar
                      </span>
                      <span style={{ fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: "700" }}>
                        {rechargeAmount.toFixed(2)}€
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <HiLockClosed size={14} />
                      <span>Pago seguro procesado por Stripe</span>
                    </div>
                  </div>

                  <button
                    onClick={handleRechargeWallet}
                    disabled={loadingWallet}
                    style={{
                      width: "100%",
                      padding: "1.125rem 2rem",
                      background: loadingWallet 
                        ? "var(--bg-overlay-05)" 
                        : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      cursor: loadingWallet ? "not-allowed" : "pointer",
                      fontWeight: "700",
                      fontSize: "1rem",
                      transition: "all 0.2s",
                      marginBottom: "1rem",
                      opacity: loadingWallet ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem",
                      boxShadow: loadingWallet ? "none" : "0 4px 15px rgba(99, 102, 241, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingWallet) {
                        e.currentTarget.style.background = "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingWallet) {
                        e.currentTarget.style.background = "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.3)";
                      }
                    }}
                  >
                    {loadingWallet ? (
                      <>
                        <div style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(255, 255, 255, 0.3)",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }} />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <HiLockClosed size={18} />
                        <span>Pagar {rechargeAmount.toFixed(2)}€</span>
                      </>
                    )}
                  </button>

                  {/* Información de seguridad */}
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "1rem",
                    background: "rgba(16, 185, 129, 0.05)",
                    borderRadius: "10px",
                    border: "1px solid rgba(16, 185, 129, 0.15)",
                    marginTop: "1rem",
                  }}>
                    <HiShieldCheck size={20} color="#10b981" style={{ flexShrink: 0, marginTop: "0.125rem" }} />
                    <div>
                      <p style={{ 
                        fontSize: "0.8125rem", 
                        color: "var(--text-primary)", 
                        margin: 0,
                        marginBottom: "0.25rem",
                        fontWeight: "600"
                      }}>
                        Pago seguro
                      </p>
                      <p style={{ 
                        fontSize: "0.75rem", 
                        color: "var(--text-secondary)", 
                        margin: 0,
                        lineHeight: "1.5"
                      }}>
                        Tu pago está protegido con encriptación SSL. No almacenamos datos de tu tarjeta.
                      </p>
                    </div>
                  </div>
                </>
              )}

            {/* Información adicional */}
            {!rechargeAmount && (
              <div style={{
                marginTop: "2rem",
                padding: "1.25rem",
                background: "var(--bg-overlay-02)",
                borderRadius: "12px",
                border: "1px solid var(--border-overlay-1)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <HiSparkles size={20} color="#6366f1" style={{ flexShrink: 0, marginTop: "0.125rem" }} />
                  <div>
                    <p style={{ 
                      fontSize: "0.875rem", 
                      color: "var(--text-primary)", 
                      margin: 0,
                      marginBottom: "0.5rem",
                      fontWeight: "600"
                    }}>
                      ¿Cómo funciona el wallet?
                    </p>
                    <p style={{ 
                      fontSize: "0.8125rem", 
                      color: "var(--text-secondary)", 
                      margin: 0,
                      lineHeight: "1.6"
                    }}>
                      El saldo de tu wallet se usa automáticamente al inscribirte en cursos de pago. 
                      Puedes recargar cuando quieras y tu saldo no expira.
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Notificación elegante */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "2rem",
            right: "2rem",
            background: notification.type === "error" 
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : notification.type === "success"
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "white",
            padding: "1rem 1.5rem",
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
            zIndex: 3000,
            maxWidth: "400px",
            animation: "slideInRight 0.3s ease-out",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600", lineHeight: "1.5" }}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "0.25rem 0.5rem",
              borderRadius: "6px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Estilos para animación de notificación */}
      {notification && (
        <style>{`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      )}
    </div>
  );
}
