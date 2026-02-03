"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { HiTicket, HiXMark } from "react-icons/hi2";

export default function RedeemCodesTab() {
  const { data: session } = useSession();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState({
    amount: 10,
    max_uses: null as number | null,
    expires_at: "",
    description: "",
    code: "",
  });

  useEffect(() => {
    if (session?.user?.id) {
      loadCodes();
    }
  }, [session]);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/study-agents/admin/list-redeem-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_user_id: session?.user?.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setCodes(data.codes || []);
      }
    } catch (error) {
      console.error("Error cargando códigos:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCode = async () => {
    if (!newCode.amount || newCode.amount <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/study-agents/admin/create-redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_user_id: session?.user?.id,
          amount: newCode.amount,
          max_uses: newCode.max_uses || null,
          expires_at: newCode.expires_at || null,
          description: newCode.description || null,
          code: newCode.code || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`¡Código creado! Código: ${data.code.code}\nCantidad: ${data.code.amount}€`);
        setShowCreateModal(false);
        setNewCode({
          amount: 10,
          max_uses: null,
          expires_at: "",
          description: "",
          code: "",
        });
        loadCodes();
      } else {
        alert(data.detail || "Error al crear código");
      }
    } catch (error) {
      console.error("Error creando código:", error);
      alert("Error al crear código");
    } finally {
      setLoading(false);
    }
  };

  const deactivateCode = async (code: string) => {
    if (!confirm("¿Estás seguro de desactivar este código?")) return;

    try {
      const response = await fetch("/api/study-agents/admin/deactivate-redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session?.user?.id,
          code: code,
        }),
      });
      const data = await response.json();
      if (data.success) {
        loadCodes();
      } else {
        alert(data.detail || "Error al desactivar código");
      }
    } catch (error) {
      console.error("Error desactivando código:", error);
      alert("Error al desactivar código");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: "700", margin: 0 }}>Códigos Canjeables</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: "0.75rem 1.5rem",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <HiTicket size={20} />
          Crear Código
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
          Cargando códigos...
        </div>
      ) : (
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "12px",
          border: "1px solid var(--border-overlay-1)",
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-overlay-05)", borderBottom: "2px solid var(--border-overlay-1)" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Código</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Cantidad</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Usos</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Expiración</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Estado</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Descripción</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    No hay códigos creados
                  </td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr key={code.code} style={{ borderBottom: "1px solid var(--border-overlay-1)" }}>
                    <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "1rem", fontWeight: "700", color: "#6366f1" }}>
                      {code.code}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "600" }}>
                      {code.amount.toFixed(2)}€
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {code.current_uses || 0}
                      {code.max_uses ? ` / ${code.max_uses}` : " / ∞"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : "Sin expiración"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        background: code.is_active ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: code.is_active ? "#10b981" : "#ef4444",
                      }}>
                        {code.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      {code.description || "-"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(code.code);
                          alert("Código copiado al portapapeles");
                        }}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "var(--bg-overlay-05)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-overlay-1)",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          marginRight: "0.5rem",
                        }}
                      >
                        Copiar
                      </button>
                      {code.is_active && (
                        <button
                          onClick={() => deactivateCode(code.code)}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
              border: "1px solid var(--border-overlay-1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>
                Crear Código Canjeable
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "0.5rem",
                }}
              >
                <HiXMark size={24} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                  Cantidad (€) *
                </label>
                <input
                  type="number"
                  value={newCode.amount}
                  onChange={(e) => setNewCode({ ...newCode, amount: parseFloat(e.target.value) || 0 })}
                  min="0.01"
                  step="0.01"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-overlay-1)",
                    background: "var(--bg-overlay-05)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                  Código personalizado (opcional)
                </label>
                <input
                  type="text"
                  value={newCode.code}
                  onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                  placeholder="Dejar vacío para generar automáticamente"
                  maxLength={20}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-overlay-1)",
                    background: "var(--bg-overlay-05)",
                    color: "var(--text-primary)",
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                  Usos máximos (opcional)
                </label>
                <input
                  type="number"
                  value={newCode.max_uses || ""}
                  onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  min="1"
                  placeholder="Ilimitado"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-overlay-1)",
                    background: "var(--bg-overlay-05)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                  Fecha de expiración (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={newCode.expires_at}
                  onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-overlay-1)",
                    background: "var(--bg-overlay-05)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                  Descripción (opcional)
                </label>
                <textarea
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                  placeholder="Ej: Promoción de verano, Código para influencers, etc."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-overlay-1)",
                    background: "var(--bg-overlay-05)",
                    color: "var(--text-primary)",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "var(--bg-overlay-05)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-overlay-1)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={createCode}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Creando..." : "Crear Código"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para canjear código (para usuarios) */}
      <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-overlay-1)" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem" }}>Canjear Código</h3>
        <RedeemCodeForm />
      </div>
    </div>
  );
}

// Componente para canjear códigos (reutilizable)
function RedeemCodeForm() {
  const { data: session } = useSession();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const redeemCode = async () => {
    if (!code.trim()) {
      setMessage({ type: "error", text: "Por favor, introduce un código" });
      return;
    }

    if (!session?.user?.id) {
      setMessage({ type: "error", text: "Debes iniciar sesión para canjear códigos" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/study-agents/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          code: code.toUpperCase().trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: "success", 
          text: `¡Código canjeado! Se han añadido ${data.amount}€ a tu wallet.` 
        });
        setCode("");
        // Recargar wallet si hay un callback
        if (typeof window !== "undefined" && (window as any).onWalletUpdate) {
          (window as any).onWalletUpdate();
        }
      } else {
        setMessage({ type: "error", text: data.detail || "Error al canjear el código" });
      }
    } catch (error) {
      console.error("Error canjeando código:", error);
      setMessage({ type: "error", text: "Error al canjear el código. Por favor, inténtalo de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setMessage(null);
          }}
          placeholder="Introduce el código"
          maxLength={20}
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--border-overlay-1)",
            background: "var(--bg-overlay-05)",
            color: "var(--text-primary)",
            fontFamily: "monospace",
            fontSize: "1rem",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !loading) {
              redeemCode();
            }
          }}
        />
        <button
          onClick={redeemCode}
          disabled={loading || !code.trim()}
          style={{
            padding: "0.75rem 1.5rem",
            background: loading || !code.trim() 
              ? "var(--bg-overlay-05)" 
              : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: loading || !code.trim() ? "var(--text-secondary)" : "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading || !code.trim() ? "not-allowed" : "pointer",
            fontWeight: "600",
            opacity: loading || !code.trim() ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <HiTicket size={18} />
          {loading ? "Canjeando..." : "Canjear"}
        </button>
      </div>

      {message && (
        <div style={{
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          background: message.type === "success" 
            ? "rgba(16, 185, 129, 0.15)" 
            : "rgba(239, 68, 68, 0.15)",
          color: message.type === "success" ? "#10b981" : "#ef4444",
          fontSize: "0.875rem",
          fontWeight: "500",
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}

