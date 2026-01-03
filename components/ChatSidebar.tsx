"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { spaceGrotesk, outfit } from "../app/fonts";

interface Chat {
  chat_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  metadata?: {
    color?: string;
    icon?: string;
    uploadedFiles?: string[];
    selectedModel?: string;
  };
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectChat: (chatId: string) => void;
  currentChatId: string | null;
  onNewChat: () => void;
  colorTheme?: "dark" | "light";
  onCollapsedChange?: (isCollapsed: boolean) => void;
}

export default function ChatSidebar({
  isOpen,
  onToggle,
  onSelectChat,
  currentChatId,
  onNewChat,
  colorTheme = "dark",
  onCollapsedChange,
}: ChatSidebarProps) {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingColorChatId, setEditingColorChatId] = useState<string | null>(null);
  const [editingIconChatId, setEditingIconChatId] = useState<string | null>(null);
  const [deleteConfirmChatId, setDeleteConfirmChatId] = useState<string | null>(null);
  const [deleteConfirmChatTitle, setDeleteConfirmChatTitle] = useState<string>("");
  const isSavingRef = useRef<boolean>(false);

  // Colores disponibles para los chats
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

  // Iconos disponibles para los chats
  const chatIcons = [
    { name: "Chat", value: "chat" },
    { name: "Libro", value: "book" },
    { name: "Notas", value: "notes" },
    { name: "Objetivo", value: "target" },
    { name: "Estrella", value: "star" },
  ];

  // Función para renderizar el icono según el tipo
  const renderIcon = (iconType: string = "chat", color: string = "#6366f1", isSelected: boolean = false) => {
    const iconColor = color || "#6366f1";
    // Si está seleccionado, usar blanco. Si no, usar el color del tema
    const strokeColor = isSelected 
      ? (iconColor ? "white" : "#6366f1")
      : (colorTheme === "dark" ? "rgba(226, 232, 240, 0.8)" : "rgba(26, 36, 52, 0.8)");
    
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

  const userId = session?.user?.id || "";

  // Variables de tema
  const bgColor = colorTheme === "dark" ? "rgba(26, 26, 36, 0.95)" : "rgba(255, 255, 255, 0.95)";
  const textColor = colorTheme === "dark" ? "#e2e8f0" : "#1a1a24";
  const secondaryTextColor = colorTheme === "dark" ? "rgba(226, 232, 240, 0.6)" : "rgba(26, 36, 52, 0.6)";
  const borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";
  const activeBg = colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)";
  const activeBorder = colorTheme === "dark" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.3)";
  const hoverBg = colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.05)";
  const inputBg = colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "rgba(255, 255, 255, 0.9)";
  const inputBorder = colorTheme === "dark" ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0.4)";
  const buttonBg = colorTheme === "dark" ? "transparent" : "rgba(255, 255, 255, 0.5)";
  const buttonBorder = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";

  // Cargar conversaciones
  useEffect(() => {
    if (!userId) return;

    const loadChats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/study-agents/list-chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });

        const data = await response.json();
        if (data.success && data.chats) {
          // Asegurarse de que cada chat tenga metadata
          const chatsWithMetadata = data.chats.map((chat: any) => {
            const chatWithMeta = {
              ...chat,
              metadata: chat.metadata || {}
            };
            // Debug: verificar que el color esté presente
            if (chatWithMeta.metadata?.color) {
              console.log(`✅ Chat ${chatWithMeta.chat_id} tiene color:`, chatWithMeta.metadata.color);
            }
            return chatWithMeta;
          });
          setChats(chatsWithMetadata);
        }
      } catch (error) {
        console.error("Error loading chats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [userId]);

  // Función para refrescar la lista de chats
  const refreshChats = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch("/api/study-agents/list-chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      if (data.success && data.chats) {
        // Asegurarse de que cada chat tenga metadata y debug
        const chatsWithMetadata = data.chats.map((chat: any) => {
          const chatWithMeta = {
            ...chat,
            metadata: chat.metadata || {}
          };
          console.log(`🔄 Refreshing chat "${chatWithMeta.title}":`, {
            chat_id: chatWithMeta.chat_id,
            metadata: chatWithMeta.metadata,
            color: chatWithMeta.metadata?.color
          });
          return chatWithMeta;
        });
        setChats(chatsWithMetadata);
      }
    } catch (error) {
      console.error("Error refreshing chats:", error);
    }
  };

  // Exponer refreshChats al componente padre
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).refreshChatSidebar = refreshChats;
    }
  }, [userId]);

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Mostrar modal de confirmación
    const chat = chats.find((c) => c.chat_id === chatId);
    setDeleteConfirmChatId(chatId);
    setDeleteConfirmChatTitle(chat?.title || "esta conversación");
  };

  const confirmDeleteChat = async () => {
    if (!deleteConfirmChatId) return;

    try {
      const response = await fetch("/api/study-agents/delete-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, chatId: deleteConfirmChatId }),
      });

      const data = await response.json();
      if (data.success) {
        setChats(chats.filter((chat) => chat.chat_id !== deleteConfirmChatId));
        if (currentChatId === deleteConfirmChatId) {
          onNewChat();
        }
        setDeleteConfirmChatId(null);
        setDeleteConfirmChatTitle("");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const cancelDeleteChat = () => {
    setDeleteConfirmChatId(null);
    setDeleteConfirmChatTitle("");
  };

  const handleEditTitle = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
    // Guardar el título original para detectar si se renombra "General"
    (window as any).editingChatOriginalTitle = currentTitle;
  };

  const handleSaveTitle = async (chatId: string, oldTitle: string): Promise<void> => {
    const titleToSave = editingTitle.trim();
    
    if (!titleToSave) {
      setEditingChatId(null);
      setEditingTitle("");
      return;
    }

    // Si el título no cambió, solo cancelar edición
    if (titleToSave === oldTitle) {
      setEditingChatId(null);
      setEditingTitle("");
      return;
    }

    try {
      const response = await fetch("/api/study-agents/update-chat-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, chatId, title: titleToSave }),
      });

      const data = await response.json();
      if (data.success) {
        setChats(chats.map((chat) => 
          chat.chat_id === chatId ? { ...chat, title: titleToSave } : chat
        ));
        setEditingChatId(null);
        setEditingTitle("");
        
        // Si se renombró "General" a otro nombre, notificar al componente padre
        if (oldTitle === "General" && titleToSave !== "General") {
          if (typeof window !== "undefined" && (window as any).onGeneralRenamed) {
            (window as any).onGeneralRenamed();
          }
        }
      } else {
        console.error("Error updating title:", data.error);
      }
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Hoy";
    } else if (days === 1) {
      return "Ayer";
    } else if (days < 7) {
      return `Hace ${days} días`;
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: "fixed",
          left: "0",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 1000,
          padding: "0.75rem",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none",
          borderTopRightRadius: "12px",
          borderBottomRightRadius: "12px",
          cursor: "pointer",
          color: "white",
          boxShadow: colorTheme === "dark" 
            ? "0 4px 12px rgba(0, 0, 0, 0.3)" 
            : "0 4px 12px rgba(99, 102, 241, 0.3)",
        }}
        title="Mostrar conversaciones"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* Modal de confirmación para eliminar */}
      {deleteConfirmChatId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: colorTheme === "dark" 
              ? "rgba(0, 0, 0, 0.8)" 
              : "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "1rem",
          }}
          onClick={cancelDeleteChat}
        >
          <div
            style={{
              background: colorTheme === "dark" 
                ? "rgba(26, 26, 36, 0.95)" 
                : "rgba(255, 255, 255, 0.95)",
              border: `1px solid ${borderColor}`,
              borderRadius: "24px",
              padding: "2rem",
              maxWidth: "500px",
              width: "100%",
              boxShadow: colorTheme === "dark"
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
                : "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin: "0 auto 1.5rem",
                  borderRadius: "50%",
                  background: colorTheme === "dark"
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h2
                className={spaceGrotesk.className}
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: textColor,
                  marginBottom: "0.5rem",
                }}
              >
                Eliminar conversación
              </h2>
              <p
                className={outfit.className}
                style={{
                  fontSize: "1rem",
                  color: secondaryTextColor,
                  lineHeight: 1.6,
                }}
              >
                ¿Estás seguro de que quieres eliminar <strong style={{ color: textColor }}>"{deleteConfirmChatTitle}"</strong>?
                <br />
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={cancelDeleteChat}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "transparent",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "10px",
                  color: textColor,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = hoverBg;
                  e.currentTarget.style.borderColor = colorTheme === "dark"
                    ? "rgba(148, 163, 184, 0.4)"
                    : "rgba(148, 163, 184, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = borderColor;
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteChat}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#ef4444",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ef4444";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: isCollapsed ? "60px" : "280px",
          background: bgColor,
          borderRight: `1px solid ${borderColor}`,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s ease",
          backdropFilter: "blur(10px)",
          boxShadow: colorTheme === "dark" 
            ? "4px 0 15px rgba(0, 0, 0, 0.2)" 
            : "4px 0 15px rgba(0, 0, 0, 0.1)",
        }}
      >
      {/* Header */}
      <div
        style={{
          padding: "1rem",
          borderBottom: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        {!isCollapsed && (
          <h2
            className={spaceGrotesk.className}
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: textColor,
              margin: 0,
            }}
          >
            Conversaciones
          </h2>
        )}
        <div style={{ display: "flex", gap: "0.5rem", marginLeft: isCollapsed ? "0" : "auto", justifyContent: isCollapsed ? "center" : "flex-end" }}>
          <button
            onClick={() => {
              const newCollapsed = !isCollapsed;
              setIsCollapsed(newCollapsed);
              if (onCollapsedChange) {
                onCollapsedChange(newCollapsed);
              }
            }}
            style={{
              padding: "0.5rem",
              background: buttonBg,
              border: `1px solid ${buttonBorder}`,
              borderRadius: "8px",
              cursor: "pointer",
              color: textColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colorTheme === "dark" 
                ? "rgba(148, 163, 184, 0.1)" 
                : "rgba(148, 163, 184, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = buttonBg;
            }}
            title={isCollapsed ? "Expandir" : "Colapsar"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isCollapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Botón Nuevo Chat */}
      {!isCollapsed && (
        <div style={{ padding: "1rem", borderBottom: `1px solid ${borderColor}` }}>
          <button
            onClick={onNewChat}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease",
              boxShadow: colorTheme === "dark" 
                ? "0 4px 12px rgba(99, 102, 241, 0.3)" 
                : "0 4px 12px rgba(99, 102, 241, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #4f46e5, #7c3aed)";
              e.currentTarget.style.boxShadow = colorTheme === "dark" 
                ? "0 6px 16px rgba(99, 102, 241, 0.4)" 
                : "0 6px 16px rgba(99, 102, 241, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #6366f1, #8b5cf6)";
              e.currentTarget.style.boxShadow = colorTheme === "dark" 
                ? "0 4px 12px rgba(99, 102, 241, 0.3)" 
                : "0 4px 12px rgba(99, 102, 241, 0.2)";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo chat
          </button>
        </div>
      )}

      {/* Lista de chats */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.5rem",
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: secondaryTextColor,
            }}
          >
            Cargando...
          </div>
        ) : chats.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: secondaryTextColor,
              fontSize: "0.875rem",
            }}
          >
            No hay conversaciones guardadas
          </div>
        ) : (
          chats.map((chat) => {
            // Obtener el color del metadata de forma más robusta
            const chatColor = (chat.metadata && typeof chat.metadata === 'object' && chat.metadata.color) 
              ? chat.metadata.color 
              : null;
            
            // Debug solo si hay problema
            if (!chatColor && chat.metadata) {
              console.warn(`⚠️ Chat "${chat.title}" tiene metadata pero NO tiene color:`, chat.metadata);
            }
            
            return (
            <div
              key={chat.chat_id}
              onClick={() => {
                if (editingChatId !== chat.chat_id && editingColorChatId !== chat.chat_id) {
                  onSelectChat(chat.chat_id);
                }
              }}
              style={{
                padding: isCollapsed ? "0.5rem" : "0.75rem",
                marginBottom: "0.5rem",
                borderRadius: "10px",
                cursor: editingChatId === chat.chat_id ? "default" : "pointer",
                background:
                  currentChatId === chat.chat_id
                    ? activeBg
                    : "transparent",
                border:
                  currentChatId === chat.chat_id
                    ? `1px solid ${activeBorder}`
                    : "1px solid transparent",
                transition: "all 0.2s ease",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: isCollapsed ? "0" : "0.75rem",
              }}
              onMouseEnter={(e) => {
                if (currentChatId !== chat.chat_id && editingChatId !== chat.chat_id) {
                  e.currentTarget.style.background = hoverBg;
                }
              }}
              onMouseLeave={(e) => {
                if (currentChatId !== chat.chat_id && editingChatId !== chat.chat_id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <div
                key={`icon-${chat.chat_id}-${chatColor || 'default'}`}
                style={{
                  minWidth: "32px",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: chatColor || (colorTheme === "dark" 
                      ? "rgba(99, 102, 241, 0.2)" 
                      : "rgba(99, 102, 241, 0.1)"),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: chatColor
                    ? `0 2px 8px ${chatColor}40`
                    : "none",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Por defecto, abrir selector de color
                  if (editingColorChatId !== chat.chat_id && editingIconChatId !== chat.chat_id) {
                    setEditingColorChatId(chat.chat_id);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  if (chatColor) {
                    e.currentTarget.style.boxShadow = `0 4px 12px ${chatColor}60`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  if (chatColor) {
                    e.currentTarget.style.boxShadow = `0 2px 8px ${chatColor}40`;
                  }
                }}
                title="Cambiar color e icono"
              >
                {renderIcon(chat.metadata?.icon || "chat", chatColor, true)}
              </div>
              {!isCollapsed && (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingChatId === chat.chat_id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={(e) => {
                          // Solo guardar si no se está guardando ya (evitar doble guardado)
                          if (!isSavingRef.current && editingChatId === chat.chat_id) {
                            setTimeout(() => {
                              if (!isSavingRef.current && editingChatId === chat.chat_id) {
                                const oldTitle = (window as any).editingChatOriginalTitle || chat.title;
                                handleSaveTitle(chat.chat_id, oldTitle);
                              }
                            }, 150);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            isSavingRef.current = true;
                            const oldTitle = (window as any).editingChatOriginalTitle || chat.title;
                            handleSaveTitle(chat.chat_id, oldTitle).finally(() => {
                              isSavingRef.current = false;
                            });
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                        style={{
                          width: "100%",
                          padding: "0.25rem 0.5rem",
                          background: inputBg,
                          border: `1px solid ${inputBorder}`,
                          borderRadius: "6px",
                          color: textColor,
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          outline: "none",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: textColor,
                            marginBottom: "0.25rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          onDoubleClick={(e) => handleEditTitle(chat.chat_id, chat.title, e)}
                          title="Doble clic para editar"
                        >
                          {chat.title}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: secondaryTextColor,
                          }}
                        >
                          {formatDate(chat.updated_at)} · {chat.message_count} mensajes
                        </div>
                      </>
                    )}
                  </div>
                  {editingChatId !== chat.chat_id && editingColorChatId !== chat.chat_id && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          opacity: currentChatId === chat.chat_id ? 1 : 0.6,
                          transition: "opacity 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          if (currentChatId !== chat.chat_id) {
                            e.currentTarget.style.opacity = "0.6";
                          }
                        }}
                      >
                        <button
                          onClick={(e) => {
                            handleEditTitle(chat.chat_id, chat.title, e);
                          }}
                          style={{
                            padding: "0.5rem",
                            background: "transparent",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: secondaryTextColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#6366f1";
                            e.currentTarget.style.background = colorTheme === "dark" 
                              ? "rgba(99, 102, 241, 0.1)" 
                              : "rgba(99, 102, 241, 0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = secondaryTextColor;
                            e.currentTarget.style.background = "transparent";
                          }}
                          title="Editar nombre"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDeleteChat(chat.chat_id, e)}
                          style={{
                            padding: "0.5rem",
                            background: "transparent",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: secondaryTextColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#ef4444";
                            e.currentTarget.style.background = colorTheme === "dark" 
                              ? "rgba(239, 68, 68, 0.1)" 
                              : "rgba(239, 68, 68, 0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = secondaryTextColor;
                            e.currentTarget.style.background = "transparent";
                          }}
                          title="Eliminar conversación"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                  {(editingColorChatId === chat.chat_id || editingIconChatId === chat.chat_id) && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        padding: "0.75rem",
                        background: colorTheme === "dark" 
                          ? "rgba(26, 26, 36, 0.95)" 
                          : "rgba(255, 255, 255, 0.95)",
                        borderRadius: "12px",
                        border: `1px solid ${borderColor}`,
                        position: "absolute",
                        right: "0",
                        top: "100%",
                        marginTop: "0.5rem",
                        zIndex: 100,
                        minWidth: "240px",
                        boxShadow: colorTheme === "dark"
                          ? "0 10px 25px rgba(0, 0, 0, 0.5)"
                          : "0 10px 25px rgba(0, 0, 0, 0.2)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Selector de Color */}
                      {editingColorChatId === chat.chat_id && (
                        <>
                          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: textColor, marginBottom: "0.25rem" }}>
                            Color
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {chatColors.map((color) => (
                              <button
                                key={color.value}
                                onClick={async () => {
                                  try {
                                    const response = await fetch("/api/study-agents/update-chat-color", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({ 
                                        userId, 
                                        chatId: chat.chat_id, 
                                        color: color.value 
                                      }),
                                    });
                                    const data = await response.json();
                                    if (data.success && data.chat) {
                                      setChats(chats.map((c) => {
                                        if (c.chat_id === chat.chat_id) {
                                          return { ...c, metadata: data.chat.metadata || { ...c.metadata, color: color.value } };
                                        }
                                        return c;
                                      }));
                                      setTimeout(() => refreshChats(), 300);
                                    }
                                  } catch (error) {
                                    console.error("Error updating chat color:", error);
                                  }
                                }}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "8px",
                                  background: color.value,
                                  border: chat.metadata?.color === color.value 
                                    ? `2px solid ${colorTheme === "dark" ? "#fff" : "#000"}` 
                                    : `2px solid transparent`,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  boxShadow: chat.metadata?.color === color.value
                                    ? `0 0 0 2px ${colorTheme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}`
                                    : "none",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "scale(1.1)";
                                  e.currentTarget.style.boxShadow = `0 4px 12px ${color.value}40`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                  e.currentTarget.style.boxShadow = (chat.metadata && chat.metadata.color === color.value)
                                    ? `0 0 0 2px ${colorTheme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}`
                                    : "none";
                                }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      
                      {/* Selector de Icono */}
                      {editingIconChatId === chat.chat_id && (
                        <>
                          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: textColor, marginBottom: "0.25rem" }}>
                            Icono
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {chatIcons.map((icon) => (
                              <button
                                key={icon.value}
                                onClick={async () => {
                                  try {
                                    const response = await fetch("/api/study-agents/update-chat-color", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({ 
                                        userId, 
                                        chatId: chat.chat_id, 
                                        icon: icon.value 
                                      }),
                                    });
                                    const data = await response.json();
                                    if (data.success && data.chat) {
                                      setChats(chats.map((c) => {
                                        if (c.chat_id === chat.chat_id) {
                                          return { ...c, metadata: data.chat.metadata || { ...c.metadata, icon: icon.value } };
                                        }
                                        return c;
                                      }));
                                      setEditingIconChatId(null);
                                      setTimeout(() => refreshChats(), 300);
                                    }
                                  } catch (error) {
                                    console.error("Error updating chat icon:", error);
                                  }
                                }}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "8px",
                                  background: (chat.metadata?.icon || "chat") === icon.value
                                    ? (chatColor || (colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.2)"))
                                    : (colorTheme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.1)"),
                                  border: (chat.metadata?.icon || "chat") === icon.value
                                    ? `2px solid ${chatColor || "#6366f1"}`
                                    : `2px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.4)"}`,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.2s ease",
                                  color: (chat.metadata?.icon || "chat") === icon.value
                                    ? (chatColor ? "white" : "#6366f1")
                                    : (colorTheme === "dark" ? "rgba(226, 232, 240, 0.8)" : "rgba(26, 36, 52, 0.8)"),
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "scale(1.1)";
                                  e.currentTarget.style.background = chatColor || (colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.2)");
                                  e.currentTarget.style.color = chatColor ? "white" : "#6366f1";
                                  e.currentTarget.style.border = `2px solid ${chatColor || "#6366f1"}`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                  e.currentTarget.style.background = (chat.metadata?.icon || "chat") === icon.value
                                    ? (chatColor || (colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.2)"))
                                    : (colorTheme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.1)");
                                  e.currentTarget.style.color = (chat.metadata?.icon || "chat") === icon.value
                                    ? (chatColor ? "white" : "#6366f1")
                                    : (colorTheme === "dark" ? "rgba(226, 232, 240, 0.8)" : "rgba(26, 36, 52, 0.8)");
                                  e.currentTarget.style.border = (chat.metadata?.icon || "chat") === icon.value
                                    ? `2px solid ${chatColor || "#6366f1"}`
                                    : `2px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.4)"}`;
                                }}
                                title={icon.name}
                              >
                                {renderIcon(icon.value, chatColor || "#6366f1", (chat.metadata?.icon || "chat") === icon.value)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {/* Botones para cambiar entre color e icono */}
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: `1px solid ${borderColor}` }}>
                        <button
                          onClick={() => {
                            setEditingColorChatId(editingColorChatId === chat.chat_id ? null : chat.chat_id);
                            setEditingIconChatId(null);
                          }}
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            background: editingColorChatId === chat.chat_id ? activeBg : "transparent",
                            border: `1px solid ${editingColorChatId === chat.chat_id ? activeBorder : borderColor}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: textColor,
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            transition: "all 0.2s ease",
                          }}
                        >
                          Color
                        </button>
                        <button
                          onClick={() => {
                            setEditingIconChatId(editingIconChatId === chat.chat_id ? null : chat.chat_id);
                            setEditingColorChatId(null);
                          }}
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            background: editingIconChatId === chat.chat_id ? activeBg : "transparent",
                            border: `1px solid ${editingIconChatId === chat.chat_id ? activeBorder : borderColor}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: textColor,
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            transition: "all 0.2s ease",
                          }}
                        >
                          Icono
                        </button>
                        <button
                          onClick={() => {
                            setEditingColorChatId(null);
                            setEditingIconChatId(null);
                          }}
                          style={{
                            padding: "0.5rem",
                            background: "transparent",
                            border: `1px solid ${borderColor}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: textColor,
                          }}
                          title="Cerrar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            );
          })
        )}
      </div>
    </div>
    </>
  );
}

