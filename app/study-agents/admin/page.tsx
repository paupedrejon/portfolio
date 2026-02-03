"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  HiAcademicCap, 
  HiCurrencyEuro, 
  HiUsers, 
  HiChartBar,
  HiCog,
  HiBookOpen,
  HiCreditCard,
  HiArrowLeft,
  HiTicket
} from "react-icons/hi2";
import RedeemCodesTab from "./redeem-codes-tab";

// Lista de administradores (por ahora hardcodeado, luego se puede mover a BD)
const ADMIN_EMAILS = [
  "pau.pedrejon@gmail.com", // Añade tu email aquí
  // Añade más emails de admin si es necesario
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "courses" | "payments" | "users" | "codes">("dashboard");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/study-agents/admin");
      return;
    }

    if (session?.user?.email) {
      const admin = ADMIN_EMAILS.includes(session.user.email);
      setIsAdmin(admin);
      setLoading(false);
      
      if (!admin) {
        router.push("/study-agents");
      }
    }
  }, [session, status, router]);

  if (loading || status === "loading") {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)"
      }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      color: "var(--text-primary)"
    }}>
      {/* Header */}
      <div style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-overlay-1)",
        padding: "1.5rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.push("/study-agents")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s"
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
            <HiArrowLeft size={20} />
            <span>Volver</span>
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700" }}>
              Panel de Administración
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Gestiona cursos, pagos y usuarios
            </p>
          </div>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.875rem",
          color: "var(--text-secondary)"
        }}>
          <span>{session?.user?.email}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-overlay-1)",
        padding: "0 2rem"
      }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { id: "dashboard", label: "Dashboard", icon: HiChartBar },
            { id: "courses", label: "Cursos", icon: HiBookOpen },
            { id: "payments", label: "Pagos", icon: HiCreditCard },
            { id: "users", label: "Usuarios", icon: HiUsers },
            { id: "codes", label: "Códigos", icon: HiTicket },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "1rem 1.5rem",
                  background: activeTab === tab.id ? "var(--bg-overlay-05)" : "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "3px solid #6366f1" : "3px solid transparent",
                  color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: activeTab === tab.id ? "600" : "500",
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = "var(--bg-overlay-02)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "courses" && <CoursesTab />}
        {activeTab === "payments" && <PaymentsTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "codes" && <RedeemCodesTab />}
        {activeTab === "codes" && <RedeemCodesTab />}
      </div>
    </div>
  );
}

// Componente Dashboard
function DashboardTab() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadStats();
    }
  }, [session]);

  const loadStats = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch("/api/study-agents/admin-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_user_id: session.user.id
        })
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando estadísticas...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: "2rem", fontSize: "1.5rem", fontWeight: "700" }}>
        Resumen General
      </h2>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        <StatCard
          title="Total Cursos"
          value={stats?.total_courses || 0}
          icon={HiAcademicCap}
          color="#6366f1"
        />
        <StatCard
          title="Total Inscripciones"
          value={stats?.total_enrollments || 0}
          icon={HiUsers}
          color="#10b981"
        />
        <StatCard
          title="Ingresos Totales"
          value={`${(stats?.total_revenue || 0).toFixed(2)}€`}
          icon={HiCurrencyEuro}
          color="#f59e0b"
        />
        <StatCard
          title="Usuarios Activos"
          value={stats?.active_users || 0}
          icon={HiChartBar}
          color="#ef4444"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: "12px",
      padding: "1.5rem",
      border: "1px solid var(--border-overlay-1)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ 
            margin: 0, 
            fontSize: "0.875rem", 
            color: "var(--text-secondary)",
            marginBottom: "0.5rem"
          }}>
            {title}
          </p>
          <p style={{ 
            margin: 0, 
            fontSize: "2rem", 
            fontWeight: "700",
            color: "var(--text-primary)"
          }}>
            {value}
          </p>
        </div>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={24} color={color} />
        </div>
      </div>
    </div>
  );
}

// Componente Cursos
function CoursesTab() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch("/api/study-agents/list-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Error cargando cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando cursos...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700" }}>
          Gestión de Cursos
        </h2>
        <button
          onClick={() => window.location.href = "/study-agents/create-course"}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <HiAcademicCap size={18} />
          <span>Crear Curso</span>
        </button>
      </div>

      <div style={{
        background: "var(--bg-card)",
        borderRadius: "12px",
        border: "1px solid var(--border-overlay-1)",
        overflow: "hidden"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-overlay-05)", borderBottom: "1px solid var(--border-overlay-1)" }}>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Título</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Precio</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Inscripciones</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Creador</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.course_id} style={{ borderBottom: "1px solid var(--border-overlay-1)" }}>
                <td style={{ padding: "1rem" }}>{course.title}</td>
                <td style={{ padding: "1rem" }}>{course.price === 0 ? "Gratis" : `${course.price.toFixed(2)}€`}</td>
                <td style={{ padding: "1rem" }}>{course.enrollment_count || 0}</td>
                <td style={{ padding: "1rem" }}>{course.creator_id || "N/A"}</td>
                <td style={{ padding: "1rem" }}>
                  <button
                    onClick={() => window.location.href = `/study-agents/course/${course.course_id}`}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "var(--bg-overlay-05)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-overlay-1)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.875rem"
                    }}
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente Pagos
function PaymentsTab() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadPayments();
    }
  }, [session]);

  const loadPayments = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch("/api/study-agents/admin-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_user_id: session.user.id
        })
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error("Error cargando pagos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando pagos...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: "2rem", fontSize: "1.5rem", fontWeight: "700" }}>
        Historial de Pagos
      </h2>

      <div style={{
        background: "var(--bg-card)",
        borderRadius: "12px",
        border: "1px solid var(--border-overlay-1)",
        overflow: "hidden"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-overlay-05)", borderBottom: "1px solid var(--border-overlay-1)" }}>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Usuario</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Tipo</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Monto</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Fecha</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  No hay pagos registrados
                </td>
              </tr>
            ) : (
              payments.map((payment, index) => (
                <tr key={index} style={{ borderBottom: "1px solid var(--border-overlay-1)" }}>
                  <td style={{ padding: "1rem" }}>{payment.user_id || "N/A"}</td>
                  <td style={{ padding: "1rem" }}>{payment.type || "N/A"}</td>
                  <td style={{ padding: "1rem", fontWeight: "600" }}>{payment.amount?.toFixed(2) || "0.00"}€</td>
                  <td style={{ padding: "1rem" }}>{payment.timestamp ? new Date(payment.timestamp).toLocaleDateString() : "N/A"}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      background: payment.status === "completed" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      color: payment.status === "completed" ? "#10b981" : "#ef4444"
                    }}>
                      {payment.status || "pending"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente Usuarios
function UsersTab() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadUsers();
    }
  }, [session]);

  const loadUsers = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch("/api/study-agents/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_user_id: session.user.id
        })
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando usuarios...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: "2rem", fontSize: "1.5rem", fontWeight: "700" }}>
        Gestión de Usuarios
      </h2>

      {selectedUser ? (
        <div>
          <button
            onClick={() => setSelectedUser(null)}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--bg-overlay-05)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-overlay-1)",
              borderRadius: "6px",
              cursor: "pointer",
              marginBottom: "1.5rem",
              fontSize: "0.875rem"
            }}
          >
            ← Volver a la lista
          </button>

          <div style={{
            background: "var(--bg-card)",
            borderRadius: "12px",
            border: "1px solid var(--border-overlay-1)",
            padding: "2rem"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: "700" }}>
              Detalles del Usuario: {selectedUser.user_id}
            </h3>

            {/* Wallet Info */}
            <div style={{ marginBottom: "2rem" }}>
              <h4 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: "600" }}>Wallet</h4>
              {selectedUser.wallet ? (
                <div style={{
                  background: "var(--bg-overlay-05)",
                  borderRadius: "8px",
                  padding: "1rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem"
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>Saldo Actual</p>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.5rem", fontWeight: "700" }}>
                      {selectedUser.wallet.balance?.toFixed(2) || "0.00"}€
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>Total Depositado</p>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.25rem", fontWeight: "600" }}>
                      {selectedUser.wallet.total_deposited?.toFixed(2) || "0.00"}€
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>Total Gastado</p>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.25rem", fontWeight: "600" }}>
                      {selectedUser.wallet.total_spent?.toFixed(2) || "0.00"}€
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>Transacciones</p>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.25rem", fontWeight: "600" }}>
                      {selectedUser.wallet.transaction_count || 0}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--text-secondary)" }}>No hay información de wallet</p>
              )}
            </div>

            {/* Enrollments */}
            <div>
              <h4 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: "600" }}>
                Cursos Inscritos ({selectedUser.enrollments?.length || 0})
              </h4>
              {selectedUser.enrollments && selectedUser.enrollments.length > 0 ? (
                <div style={{
                  display: "grid",
                  gap: "1rem"
                }}>
                  {selectedUser.enrollments.map((enrollment: any) => (
                    <div
                      key={enrollment.course_id}
                      style={{
                        background: "var(--bg-overlay-05)",
                        borderRadius: "8px",
                        padding: "1rem",
                        border: "1px solid var(--border-overlay-1)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: "600", fontSize: "1rem" }}>
                            {enrollment.course_title}
                          </p>
                          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            Precio: {enrollment.course_price === 0 ? "Gratis" : `${enrollment.course_price.toFixed(2)}€`}
                          </p>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            Inscrito: {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>Créditos</p>
                          <p style={{ margin: "0.25rem 0 0 0", fontWeight: "600" }}>
                            {enrollment.credits_remaining || 0}
                          </p>
                          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>XP</p>
                          <p style={{ margin: "0.25rem 0 0 0", fontWeight: "600" }}>
                            {enrollment.xp || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--text-secondary)" }}>No hay cursos inscritos</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "12px",
          border: "1px solid var(--border-overlay-1)",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-overlay-05)", borderBottom: "1px solid var(--border-overlay-1)" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Usuario ID</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Saldo</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Total Depositado</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Total Gastado</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Cursos</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.user_id} style={{ borderBottom: "1px solid var(--border-overlay-1)" }}>
                    <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {user.user_id}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "600" }}>
                      {user.wallet?.balance?.toFixed(2) || "0.00"}€
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {user.wallet?.total_deposited?.toFixed(2) || "0.00"}€
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {user.wallet?.total_spent?.toFixed(2) || "0.00"}€
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {user.active_courses || 0}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => setSelectedUser(user)}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "#6366f1",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "600"
                        }}
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

