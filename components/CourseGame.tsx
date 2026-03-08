"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { HiXMark, HiUsers, HiPlay, HiTrophy } from "react-icons/hi2";

// Estilos CSS con animaciones mejoradas para el parchís
const styles = `
  @keyframes diceRoll3D {
    0% { 
      transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
      filter: brightness(1);
    }
    10% { 
      transform: rotateX(90deg) rotateY(180deg) rotateZ(45deg) scale(1.3);
      filter: brightness(1.3);
    }
    20% { 
      transform: rotateX(180deg) rotateY(360deg) rotateZ(90deg) scale(1.1);
      filter: brightness(1.1);
    }
    30% { 
      transform: rotateX(270deg) rotateY(540deg) rotateZ(135deg) scale(1.4);
      filter: brightness(1.4);
    }
    40% { 
      transform: rotateX(360deg) rotateY(720deg) rotateZ(180deg) scale(1.2);
      filter: brightness(1.2);
    }
    50% { 
      transform: rotateX(450deg) rotateY(900deg) rotateZ(225deg) scale(1.5);
      filter: brightness(1.5);
    }
    60% { 
      transform: rotateX(540deg) rotateY(1080deg) rotateZ(270deg) scale(1.3);
      filter: brightness(1.3);
    }
    70% { 
      transform: rotateX(630deg) rotateY(1260deg) rotateZ(315deg) scale(1.4);
      filter: brightness(1.4);
    }
    80% { 
      transform: rotateX(720deg) rotateY(1440deg) rotateZ(360deg) scale(1.2);
      filter: brightness(1.2);
    }
    90% { 
      transform: rotateX(810deg) rotateY(1620deg) rotateZ(405deg) scale(1.1);
      filter: brightness(1.1);
    }
    100% { 
      transform: rotateX(900deg) rotateY(1800deg) rotateZ(450deg) scale(1);
      filter: brightness(1);
    }
  }
  
  @keyframes diceBounce {
    0%, 100% { 
      transform: translateY(0) scale(1);
    }
    25% { 
      transform: translateY(-30px) scale(1.1);
    }
    50% { 
      transform: translateY(-50px) scale(1.2);
    }
    75% { 
      transform: translateY(-30px) scale(1.1);
    }
  }
  
  @keyframes diceResult {
    0% { 
      transform: scale(0) rotate(180deg);
      opacity: 0;
    }
    50% { 
      transform: scale(1.3) rotate(0deg);
      opacity: 1;
    }
    100% { 
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }
  
  @keyframes pulse {
    0%, 100% { 
      transform: scale(1); 
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
    }
    50% { 
      transform: scale(1.15); 
      opacity: 0.9;
      box-shadow: 0 0 0 20px rgba(99, 102, 241, 0);
    }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-15px) scale(1.05); }
  }
  
  @keyframes glow {
    0%, 100% { 
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.6),
                  0 0 30px rgba(99, 102, 241, 0.4),
                  0 0 45px rgba(99, 102, 241, 0.2);
    }
    50% { 
      box-shadow: 0 0 25px rgba(99, 102, 241, 0.9),
                  0 0 50px rgba(99, 102, 241, 0.6),
                  0 0 75px rgba(99, 102, 241, 0.4);
    }
  }
  
  @keyframes slideIn {
    from { 
      transform: translateX(-100%) scale(0.8);
      opacity: 0;
    }
    to { 
      transform: translateX(0) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes pieceMove {
    0% { 
      transform: scale(1) rotate(0deg);
      filter: brightness(1);
    }
    50% { 
      transform: scale(1.3) rotate(10deg);
      filter: brightness(1.4);
    }
    100% { 
      transform: scale(1) rotate(0deg);
      filter: brightness(1);
    }
  }
  
  @keyframes pieceHover {
    0% { 
      transform: translateY(0) scale(1) rotate(0deg);
    }
    50% { 
      transform: translateY(-8px) scale(1.15) rotate(5deg);
    }
    100% { 
      transform: translateY(0) scale(1) rotate(0deg);
    }
  }
  
  @keyframes pieceSelect {
    0% { 
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
    }
    50% { 
      transform: scale(1.2);
      box-shadow: 0 0 0 15px rgba(99, 102, 241, 0);
    }
    100% { 
      transform: scale(1.1);
      box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
    }
  }
  
  @keyframes boardCellPulse {
    0%, 100% { 
      transform: scale(1);
      background: rgba(255, 255, 255, 0.1);
    }
    50% { 
      transform: scale(1.05);
      background: rgba(99, 102, 241, 0.2);
    }
  }
  
  @keyframes winnerCelebration {
    0%, 100% { 
      transform: scale(1) rotate(0deg);
    }
    25% { 
      transform: scale(1.1) rotate(-5deg);
    }
    50% { 
      transform: scale(1.2) rotate(5deg);
    }
    75% { 
      transform: scale(1.1) rotate(-5deg);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
  
  .dice-rolling {
    animation: diceRoll3D 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55), 
               diceBounce 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    transform-style: preserve-3d;
    perspective: 1000px;
  }
  
  .dice-result {
    animation: diceResult 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .pulse-animation {
    animation: pulse 2s ease-in-out infinite;
  }
  
  .bounce-animation {
    animation: bounce 1.5s ease-in-out infinite;
  }
  
  .glow-effect {
    animation: glow 2s ease-in-out infinite;
  }
  
  .slide-in {
    animation: slideIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .piece-move {
    animation: pieceMove 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .piece-hover {
    animation: pieceHover 0.6s ease-in-out infinite;
  }
  
  .piece-select {
    animation: pieceSelect 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .game-card {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .game-card::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: rotate(45deg);
    transition: all 0.6s;
    opacity: 0;
  }
  
  .game-card:hover::before {
    animation: shimmer 1.5s infinite;
    opacity: 1;
  }
  
  .game-card:hover {
    transform: translateY(-8px) scale(1.03);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
  
  .board-cell {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }
  
  .board-cell:hover {
    transform: scale(1.15) translateZ(10px);
    z-index: 10;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }
  
  .board-cell.has-piece {
    animation: boardCellPulse 2s ease-in-out infinite;
  }
  
  .piece {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    z-index: 5;
  }
  
  .piece::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .piece:hover {
    transform: scale(1.3) rotate(10deg) translateY(-5px);
    filter: brightness(1.4) drop-shadow(0 8px 16px rgba(0,0,0,0.4));
    z-index: 20;
  }
  
  .piece:hover::before {
    opacity: 1;
  }
  
  .piece.selected {
    animation: pieceSelect 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    transform: scale(1.2);
    z-index: 15;
  }
  
  .button-glow {
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
  }
  
  .button-glow::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
                height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .button-glow:hover::before {
    width: 400px;
    height: 400px;
  }
  
  .button-glow::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: left 0.6s;
  }
  
  .button-glow:hover::after {
    left: 100%;
  }
  
  .winner-celebration {
    animation: winnerCelebration 1s ease-in-out infinite;
  }
  
  .dice-container {
    perspective: 1000px;
    transform-style: preserve-3d;
  }
  
  /* Dado 3D real */
  .dice-3d {
    width: 120px;
    height: 120px;
    position: relative;
    transform-style: preserve-3d;
    margin: 0 auto;
  }
  
  .dice-3d.rolling {
    animation: diceRoll3D 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  }
  
  .dice-face {
    position: absolute;
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
    border: 4px solid #333;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    font-weight: 900;
    color: #333;
    box-shadow: 
      inset 0 4px 8px rgba(255,255,255,0.5),
      inset 0 -4px 8px rgba(0,0,0,0.2),
      0 8px 16px rgba(0,0,0,0.3);
    backface-visibility: hidden;
  }
  
  /* Cara frontal (1) */
  .dice-face.front {
    transform: rotateY(0deg) translateZ(60px);
  }
  
  /* Cara trasera (6) */
  .dice-face.back {
    transform: rotateY(180deg) translateZ(60px);
  }
  
  /* Cara derecha (3) */
  .dice-face.right {
    transform: rotateY(90deg) translateZ(60px);
  }
  
  /* Cara izquierda (4) */
  .dice-face.left {
    transform: rotateY(-90deg) translateZ(60px);
  }
  
  /* Cara superior (5) */
  .dice-face.top {
    transform: rotateX(90deg) translateZ(60px);
  }
  
  /* Cara inferior (2) */
  .dice-face.bottom {
    transform: rotateX(-90deg) translateZ(60px);
  }
  
  /* Puntos del dado */
  .dice-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #333;
    position: absolute;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
  }
  
  /* Configuración de puntos para cada cara */
  .dice-face.front .dice-dot { top: 50%; left: 50%; transform: translate(-50%, -50%); }
  
  .dice-face.back .dice-dot:nth-child(1) { top: 20%; left: 20%; }
  .dice-face.back .dice-dot:nth-child(2) { top: 20%; right: 20%; }
  .dice-face.back .dice-dot:nth-child(3) { top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .dice-face.back .dice-dot:nth-child(4) { bottom: 20%; left: 20%; }
  .dice-face.back .dice-dot:nth-child(5) { bottom: 20%; right: 20%; }
  .dice-face.back .dice-dot:nth-child(6) { bottom: 50%; left: 50%; transform: translate(-50%, -50%); }
  
  .dice-face.right .dice-dot:nth-child(1) { top: 20%; left: 20%; }
  .dice-face.right .dice-dot:nth-child(2) { top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .dice-face.right .dice-dot:nth-child(3) { bottom: 20%; right: 20%; }
  
  .dice-face.left .dice-dot:nth-child(1) { top: 20%; left: 20%; }
  .dice-face.left .dice-dot:nth-child(2) { top: 20%; right: 20%; }
  .dice-face.left .dice-dot:nth-child(3) { bottom: 20%; left: 20%; }
  .dice-face.left .dice-dot:nth-child(4) { bottom: 20%; right: 20%; }
  
  .dice-face.top .dice-dot:nth-child(1) { top: 20%; left: 20%; }
  .dice-face.top .dice-dot:nth-child(2) { top: 20%; right: 20%; }
  .dice-face.top .dice-dot:nth-child(3) { top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .dice-face.top .dice-dot:nth-child(4) { bottom: 20%; left: 20%; }
  .dice-face.top .dice-dot:nth-child(5) { bottom: 20%; right: 20%; }
  
  .dice-face.bottom .dice-dot:nth-child(1) { top: 20%; left: 50%; transform: translate(-50%, -50%); }
  .dice-face.bottom .dice-dot:nth-child(2) { bottom: 20%; right: 50%; transform: translate(50%, 50%); }
  
  /* Animación de resultado del dado */
  @keyframes diceShowResult {
    0% {
      transform: scale(0) rotateX(720deg) rotateY(720deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.2) rotateX(360deg) rotateY(360deg);
      opacity: 1;
    }
    100% {
      transform: scale(1) rotateX(0deg) rotateY(0deg);
      opacity: 1;
    }
  }
  
  .dice-3d.show-result {
    animation: diceShowResult 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
`;

interface Game {
  game_id: string;
  course_id: string;
  creator_id: string;
  max_players: number;
  status: "waiting" | "playing" | "finished";
  invite_code?: string;  // Código de invitación para usuarios no inscritos
  players: Array<{
    user_id: string;
    color: string;
    position: number;
    pieces: number[];
    score: number;
  }>;
  current_turn: number;
  last_dice?: number;
  current_question?: {
    question: string;
    options: string[];
    correct_answer_index: number;
    explanation: string;
  };
  winner?: string;
  topic_filter?: string;
}

interface GamesViewProps {
  courseId: string;
  userId: string;
  course: {
    course_id: string;
    title: string;
    topics: Array<{ name: string }>;
  };
}

export default function GamesView({ courseId, userId, course }: GamesViewProps) {
  const { data: session } = useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [topicFilter, setTopicFilter] = useState<string>("");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceAnimationValue, setDiceAnimationValue] = useState<number>(1);
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    // Polling mejorado: más frecuente cuando es mi turno, menos frecuente cuando no
    if (currentGame && (currentGame.status === "playing" || currentGame.status === "waiting")) {
      const isMyTurn = currentGame.status === "playing" && 
                       currentGame.players[currentGame.current_turn]?.user_id === userId;
      
      // Polling más frecuente si es mi turno (1s) o si estoy esperando (1.5s), menos frecuente si no (3s)
      const pollInterval = isMyTurn ? 1000 : (currentGame.status === "waiting" ? 1500 : 3000);
      
      const interval = setInterval(() => {
        // Solo hacer polling si no hay una operación en curso
        if (!loading) {
          loadGame(currentGame.game_id);
        }
      }, pollInterval);
      
      setPollingInterval(interval);
      
      return () => {
        clearInterval(interval);
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [currentGame?.game_id, currentGame?.status, currentGame?.current_turn, userId, loading]);

  // Timer de turno
  useEffect(() => {
    if (currentGame && currentGame.status === "playing") {
      const isMyTurn = currentGame.players[currentGame.current_turn]?.user_id === userId;
      
      if (isMyTurn && !currentGame.current_question && !currentGame.last_dice) {
        // Reiniciar timer cuando es mi turno
        setTurnTimer(30);
        
        const timer = setInterval(() => {
          setTurnTimer((prev) => {
            if (prev <= 1) {
              // Tiempo agotado - pasar turno automáticamente
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setTimerInterval(timer);
        
        return () => {
          clearInterval(timer);
        };
      } else {
        // Pausar timer si no es mi turno o hay una acción en curso
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
      }
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  }, [currentGame?.current_turn, currentGame?.status, currentGame?.current_question, currentGame?.last_dice, userId]);

  const loadGames = async () => {
    try {
      const response = await fetch("/api/study-agents/get-course-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          status: null, // Todas las partidas
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGames(data.games || []);
        }
      }
    } catch (error) {
      console.error("Error cargando partidas:", error);
    }
  };

  const loadGame = async (gameId: string) => {
    try {
      const response = await fetch("/api/study-agents/get-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId,
          user_id: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentGame(data.game);
        }
      }
    } catch (error) {
      console.error("Error cargando partida:", error);
    }
  };

  const createGame = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/study-agents/create-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          user_id: userId,
          max_players: maxPlayers,
          topic_filter: topicFilter || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentGame(data.game);
          setShowCreateModal(false);
          loadGames();
          // Mostrar código de invitación si existe
          if (data.game.invite_code) {
            alert(`¡Partida creada! Código de invitación: ${data.game.invite_code}\n\nComparte este código con otros jugadores para que se unan, incluso si no están inscritos en el curso.`);
          }
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "Error al crear partida";
        
        // Si el error es por tener partidas activas, ofrecer eliminarlas
        if (errorMessage.includes("Ya tienes una partida activa")) {
          if (confirm(`${errorMessage}\n\n¿Quieres eliminar todas tus partidas antiguas en este curso?`)) {
            deleteAllUserGames();
          }
        } else {
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error creando partida:", error);
      alert("Error al crear partida");
    } finally {
      setLoading(false);
    }
  };

  const deleteAllUserGames = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar todas tus partidas antiguas en este curso? Esto eliminará todas las partidas que creaste y que están esperando jugadores.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/study-agents/delete-user-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          course_id: courseId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(data.message || `Se eliminaron ${data.deleted_count} partida(s)`);
          loadGames();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Error al eliminar partidas");
      }
    } catch (error) {
      console.error("Error eliminando partidas:", error);
      alert("Error al eliminar partidas");
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (gameId: string, code?: string) => {
    setLoading(true);
    try {
      // Obtener nombre del usuario de la sesión o usar un valor por defecto
      const username = session?.user?.name || session?.user?.email?.split("@")[0] || `Usuario ${userId.slice(0, 6)}`;
      
      const response = await fetch("/api/study-agents/join-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId,
          user_id: userId,
          username: username,
          invite_code: code || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentGame(data.game);
          setShowJoinModal(false);
          setInviteCode("");
          setSelectedGameId(null);
          loadGames();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Error al unirse a la partida");
      }
    } catch (error) {
      console.error("Error uniéndose a partida:", error);
      alert("Error al unirse a la partida");
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!currentGame) return;
    
    // Validar que hay al menos 2 jugadores y que no hay duplicados
    if (currentGame.players.length < 2) {
      alert("Necesitas al menos 2 jugadores para iniciar la partida");
      return;
    }
    
    const playerIds = currentGame.players.map(p => p.user_id);
    if (playerIds.length !== new Set(playerIds).size) {
      alert("Hay jugadores duplicados en la partida. Por favor, espera a que se actualice.");
      loadGame(currentGame.game_id);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/study-agents/start-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: currentGame.game_id,
          user_id: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentGame(data.game);
          loadGames();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Error al iniciar partida");
        // Recargar el juego para actualizar el estado
        loadGame(currentGame.game_id);
      }
    } catch (error) {
      console.error("Error iniciando partida:", error);
      alert("Error al iniciar partida");
    } finally {
      setLoading(false);
    }
  };

  const leaveGame = async () => {
    if (!currentGame) return;
    
    if (!confirm("¿Estás seguro de que quieres abandonar esta partida?")) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/study-agents/leave-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: currentGame.game_id,
          user_id: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentGame(null);
          loadGames();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Error al abandonar partida");
      }
    } catch (error) {
      console.error("Error abandonando partida:", error);
      alert("Error al abandonar partida");
    } finally {
      setLoading(false);
    }
  };

  const deleteGame = async () => {
    if (!currentGame) return;
    
    if (!confirm("¿Estás seguro de que quieres eliminar esta partida? Todos los jugadores serán expulsados.")) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/study-agents/delete-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: currentGame.game_id,
          user_id: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentGame(null);
          loadGames();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Error al eliminar partida");
      }
    } catch (error) {
      console.error("Error eliminando partida:", error);
      alert("Error al eliminar partida");
    } finally {
      setLoading(false);
    }
  };

  const rollDice = async () => {
    if (!currentGame) return;
    
    setDiceRolling(true);
    setLoading(true);
    
    // Animación del dado: cambiar números rápidamente
    const animationInterval = setInterval(() => {
      setDiceAnimationValue(Math.floor(Math.random() * 6) + 1);
    }, 100);
    
    try {
      const response = await fetch("/api/study-agents/roll-dice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: currentGame.game_id,
          user_id: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Esperar un poco más para la animación, luego mostrar el resultado final
          setTimeout(() => {
            clearInterval(animationInterval);
            setDiceAnimationValue(data.dice_value || data.game.last_dice);
            setCurrentGame(data.game);
            setDiceRolling(false);
          }, 1500);
        } else {
          clearInterval(animationInterval);
          setDiceRolling(false);
        }
      } else {
        const errorData = await response.json();
        clearInterval(animationInterval);
        setDiceRolling(false);
        alert(errorData.detail || "Error al lanzar dado");
      }
    } catch (error) {
      console.error("Error lanzando dado:", error);
      clearInterval(animationInterval);
      setDiceRolling(false);
      alert("Error al lanzar dado");
    } finally {
      setLoading(false);
    }
  };

  const answerQuestion = async () => {
    if (!currentGame || selectedAnswer === null) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/study-agents/answer-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: currentGame.game_id,
          user_id: userId,
          answer_index: selectedAnswer,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentGame(data.game);
          setSelectedAnswer(null);
          if (data.correct) {
            alert(`¡Correcto! ${data.explanation || ""}`);
          } else {
            alert(`Incorrecto. ${data.explanation || ""}`);
          }
        }
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Error al responder");
      }
    } catch (error) {
      console.error("Error respondiendo:", error);
      alert("Error al responder");
    } finally {
      setLoading(false);
    }
  };

  const movePiece = async (pieceIndex: number) => {
    if (!currentGame) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/study-agents/move-piece", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: currentGame.game_id,
          user_id: userId,
          piece_index: pieceIndex,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentGame(data.game);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Error al mover ficha");
      }
    } catch (error) {
      console.error("Error moviendo ficha:", error);
      alert("Error al mover ficha");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlayer = () => {
    if (!currentGame) return null;
    return currentGame.players.find(p => p.user_id === userId);
  };

  const isMyTurn = () => {
    if (!currentGame || currentGame.status !== "playing") return false;
    const currentPlayer = currentGame.players[currentGame.current_turn];
    return currentPlayer.user_id === userId;
  };

  const getColorStyle = (color: string) => {
    const colors: Record<string, string> = {
      red: "#ef4444",
      blue: "#3b82f6",
      yellow: "#eab308",
      green: "#22c55e",
    };
    return colors[color] || "#6366f1";
  };
  
  // Funciones para rotar el dado según el valor
  const getDiceRotationX = (value: number) => {
    // Rotaciones para mostrar la cara correcta
    const rotations: Record<number, number> = {
      1: 0,     // frontal (1)
      2: 90,    // inferior (2)
      3: 0,     // frontal con rotación Y (3)
      4: 0,     // frontal con rotación Y (4)
      5: -90,   // superior (5)
      6: 180,   // trasera (6)
    };
    return rotations[value] || 0;
  };
  
  const getDiceRotationY = (value: number) => {
    const rotations: Record<number, number> = {
      1: 0,     // frontal
      2: 0,     // inferior
      3: -90,   // derecha (3)
      4: 90,    // izquierda (4)
      5: 0,     // superior
      6: 0,     // trasera
    };
    return rotations[value] || 0;
  };
  
  const getDiceRotationZ = (value: number) => {
    // Rotación Z adicional para mejor visualización
    return 0;
  };

  if (currentGame) {
    const currentPlayer = getCurrentPlayer();
    const myTurn = isMyTurn();
    const colorMap: Record<string, string> = {
      red: "Rojo",
      blue: "Azul",
      yellow: "Amarillo",
      green: "Verde",
    };

    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-primary)" }}>
            Partida de Parchís
          </h2>
          <button
            onClick={() => {
              setCurrentGame(null);
              loadGames();
            }}
            style={{
              padding: "0.75rem 1.5rem",
              background: "var(--bg-overlay-05)",
              border: "1px solid var(--border-overlay-1)",
              borderRadius: "12px",
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <HiXMark size={20} />
            Cerrar
          </button>
          {currentGame.status === "waiting" && (
            <>
              {currentGame.creator_id === userId ? (
                <button
                  onClick={deleteGame}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "12px",
                    color: "#ef4444",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: "600",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <HiXMark size={20} />
                  Eliminar Partida
                </button>
              ) : (
                <button
                  onClick={leaveGame}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "12px",
                    color: "#ef4444",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: "600",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <HiXMark size={20} />
                  Abandonar
                </button>
              )}
            </>
          )}
        </div>

        {/* Estado de la partida */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem",
          border: "1px solid var(--border-overlay-1)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Estado: {currentGame.status === "waiting" ? "Esperando jugadores" : currentGame.status === "playing" ? "En juego" : "Finalizada"}
              </h3>
              {currentGame.status === "waiting" && currentGame.invite_code && (
                <div style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem 1rem",
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Código de invitación:
                  </span>
                  <span style={{
                    color: "#6366f1",
                    fontWeight: "700",
                    fontSize: "1.25rem",
                    letterSpacing: "0.1em",
                    fontFamily: "monospace",
                  }}>
                    {currentGame.invite_code}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentGame.invite_code || "");
                      alert("Código copiado al portapapeles");
                    }}
                    style={{
                      padding: "0.25rem 0.5rem",
                      background: "rgba(99, 102, 241, 0.2)",
                      border: "1px solid rgba(99, 102, 241, 0.4)",
                      borderRadius: "6px",
                      color: "#6366f1",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                    }}
                  >
                    Copiar
                  </button>
                </div>
              )}
              {currentGame.status === "playing" && (
                <p style={{ color: "var(--text-secondary)" }}>
                  Turno de: {colorMap[currentGame.players[currentGame.current_turn]?.color] || "Desconocido"}
                </p>
              )}
              {currentGame.winner && (
                <p style={{ color: "#10b981", fontWeight: "600", fontSize: "1.25rem", marginTop: "0.5rem" }}>
                  🎉 Ganador: {currentGame.players.find(p => p.user_id === currentGame.winner)?.color || "Desconocido"}
                </p>
              )}
            </div>
            {currentGame.status === "waiting" && currentGame.creator_id === userId && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                {currentGame.players.length >= 2 ? (
                  <button
                    onClick={startGame}
                    disabled={loading}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: "600",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    <HiPlay size={20} />
                    Iniciar Partida
                  </button>
                ) : (
                  <div style={{
                    padding: "0.75rem 1.5rem",
                    background: "var(--bg-overlay-05)",
                    border: "1px solid var(--border-overlay-1)",
                    borderRadius: "12px",
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}>
                    Esperando más jugadores ({currentGame.players.length}/{currentGame.max_players})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Jugadores */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
            {currentGame.players.map((player, idx) => {
              const isCurrentTurn = currentGame.status === "playing" && currentGame.current_turn === idx;
              const isMe = player.user_id === userId;
              return (
                <div
                  key={player.user_id}
                  className={`game-card ${isCurrentTurn ? "glow-effect" : ""}`}
                  style={{
                    background: isCurrentTurn 
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)" 
                      : "var(--bg-overlay-05)",
                    border: `3px solid ${isCurrentTurn ? "#6366f1" : "var(--border-overlay-1)"}`,
                    borderRadius: "16px",
                    padding: "1.25rem",
                    boxShadow: isCurrentTurn ? "0 8px 24px rgba(99, 102, 241, 0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <div
                      className={isCurrentTurn ? "pulse-animation" : ""}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        background: getColorStyle(player.color),
                        boxShadow: `0 4px 12px ${getColorStyle(player.color)}40`,
                        border: `2px solid ${getColorStyle(player.color)}`,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                        {colorMap[player.color]} {isMe && "(Tú)"}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        Puntos: {player.score}
                      </div>
                    </div>
                  </div>
                  {currentGame.status === "playing" && (
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                      Fichas: {player.pieces.filter(p => p > 0 && p < 69).length} en juego
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Juego activo */}
        {currentGame.status === "playing" && (
          <div>
            {/* Dado y acciones */}
            {myTurn && (
              <div style={{
                background: "var(--bg-card)",
                borderRadius: "16px",
                padding: "2rem",
                marginBottom: "2rem",
                border: "1px solid var(--border-overlay-1)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "var(--text-primary)" }}>
                    Tu Turno
                  </h3>
                  {turnTimer > 0 && (
                    <div style={{
                      fontSize: "1.125rem",
                      fontWeight: "700",
                      color: turnTimer <= 10 ? "#ef4444" : turnTimer <= 15 ? "#f59e0b" : "#6366f1",
                      background: turnTimer <= 10 ? "rgba(239, 68, 68, 0.1)" : turnTimer <= 15 ? "rgba(245, 158, 11, 0.1)" : "rgba(99, 102, 241, 0.1)",
                      padding: "0.5rem 1rem",
                      borderRadius: "12px",
                      border: `2px solid ${turnTimer <= 10 ? "#ef4444" : turnTimer <= 15 ? "#f59e0b" : "#6366f1"}`,
                    }}>
                      ⏱️ {turnTimer}s
                    </div>
                  )}
                </div>
                
                {!currentGame.last_dice && !currentGame.current_question && (
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                    {/* Botón de dado visual */}
                    <button
                      onClick={rollDice}
                      disabled={loading || diceRolling}
                      className="button-glow"
                      style={{
                        width: "120px",
                        height: "120px",
                        background: diceRolling 
                          ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
                          : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        cursor: (loading || diceRolling) ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "800",
                        fontSize: "3rem",
                        boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)",
                        transition: "all 0.3s ease",
                        position: "relative",
                        overflow: "hidden",
                        animation: diceRolling ? "diceRoll3D 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)" : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!loading && !diceRolling) {
                          e.currentTarget.style.transform = "scale(1.1)";
                          e.currentTarget.style.boxShadow = "0 12px 32px rgba(99, 102, 241, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4)";
                      }}
                    >
                      {diceRolling ? diceAnimationValue : "🎲"}
                    </button>
                  </div>
                )}

                {currentGame.last_dice && (
                  <div style={{ marginBottom: "2rem", textAlign: "center" }}>
                    {/* Dado mostrando número durante animación */}
                    <div className="dice-container" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
                      {diceRolling ? (
                        <div style={{
                          width: "120px",
                          height: "120px",
                          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                          borderRadius: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "4rem",
                          fontWeight: "800",
                          color: "white",
                          boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)",
                          animation: "diceRoll3D 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                        }}>
                          {diceAnimationValue}
                        </div>
                      ) : (
                        <div 
                          className="dice-3d show-result"
                          style={{
                            transform: `rotateX(${getDiceRotationX(currentGame.last_dice)}deg) rotateY(${getDiceRotationY(currentGame.last_dice)}deg) rotateZ(${getDiceRotationZ(currentGame.last_dice)}deg)`
                          }}
                        >
                        {/* Cara 1 (frontal) */}
                        <div className="dice-face front">
                          <div className="dice-dot"></div>
                        </div>
                        {/* Cara 2 (inferior) */}
                        <div className="dice-face bottom">
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                        </div>
                        {/* Cara 3 (derecha) */}
                        <div className="dice-face right">
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                        </div>
                        {/* Cara 4 (izquierda) */}
                        <div className="dice-face left">
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                        </div>
                        {/* Cara 5 (superior) */}
                        <div className="dice-face top">
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                        </div>
                        {/* Cara 6 (trasera) */}
                        <div className="dice-face back">
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                          <div className="dice-dot"></div>
                        </div>
                        </div>
                      )}
                    </div>
                    <p style={{ 
                      textAlign: "center", 
                      color: "var(--text-primary)", 
                      marginTop: "0.5rem",
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}>
                      ¡Has sacado un {currentGame.last_dice}!
                    </p>
                  </div>
                )}

                {/* Pregunta mejorada */}
                {currentGame.current_question && (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)",
                    borderRadius: "20px",
                    padding: "2rem",
                    marginBottom: "1.5rem",
                    border: "2px solid rgba(99, 102, 241, 0.3)",
                    boxShadow: "0 8px 24px rgba(99, 102, 241, 0.2)",
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
                      animation: "pulse 3s ease-in-out infinite",
                      pointerEvents: "none",
                    }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "1.5rem",
                      }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          fontWeight: "700",
                          color: "white",
                          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
                        }}>
                          ❓
                        </div>
                        <h4 style={{ 
                          fontSize: "1.375rem", 
                          fontWeight: "700", 
                          color: "var(--text-primary)",
                          flex: 1,
                          lineHeight: "1.4",
                        }}>
                          {currentGame.current_question.question}
                        </h4>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {currentGame.current_question.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedAnswer(idx)}
                            disabled={loading}
                            className={selectedAnswer === idx ? "piece-select" : ""}
                            style={{
                              padding: "1.25rem 1.5rem",
                              background: selectedAnswer === idx 
                                ? "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)"
                                : "var(--bg-card)",
                              border: `3px solid ${selectedAnswer === idx ? "#6366f1" : "var(--border-overlay-1)"}`,
                              borderRadius: "12px",
                              color: "var(--text-primary)",
                              cursor: loading ? "not-allowed" : "pointer",
                              textAlign: "left",
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              fontWeight: selectedAnswer === idx ? "600" : "500",
                              fontSize: "1rem",
                              boxShadow: selectedAnswer === idx 
                                ? "0 4px 12px rgba(99, 102, 241, 0.3)" 
                                : "0 2px 6px rgba(0,0,0,0.1)",
                              position: "relative",
                              overflow: "hidden",
                            }}
                            onMouseEnter={(e) => {
                              if (!loading && selectedAnswer !== idx) {
                                e.currentTarget.style.transform = "translateX(8px) scale(1.02)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.2)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedAnswer !== idx) {
                                e.currentTarget.style.transform = "translateX(0) scale(1)";
                                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
                              }
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: selectedAnswer === idx 
                                  ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                                  : "var(--bg-overlay-05)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "700",
                                color: selectedAnswer === idx ? "white" : "var(--text-secondary)",
                                fontSize: "0.875rem",
                                flexShrink: 0,
                              }}>
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span>{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {selectedAnswer !== null && (
                        <button
                          onClick={answerQuestion}
                          disabled={loading}
                          className="button-glow"
                          style={{
                            marginTop: "1.5rem",
                            padding: "1rem 2rem",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontWeight: "700",
                            fontSize: "1.125rem",
                            width: "100%",
                            boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                            transition: "all 0.3s ease",
                            position: "relative",
                            overflow: "hidden",
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) {
                              e.currentTarget.style.transform = "scale(1.02)";
                              e.currentTarget.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.5)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.4)";
                          }}
                        >
                          {loading ? "Enviando..." : "✓ Responder"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mover fichas o pasar turno */}
                {currentGame.last_dice && !currentGame.current_question && currentPlayer && (
                  <div>
                    <h4 style={{ fontSize: "1.125rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "1rem" }}>
                      Selecciona una ficha para mover
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
                      {currentPlayer.pieces.map((piece, idx) => {
                        const canMove = piece === 0 ? currentGame.last_dice === 6 : piece + (currentGame.last_dice || 0) <= 69;
                        return (
                          <button
                            key={idx}
                            onClick={() => canMove && movePiece(idx)}
                            disabled={!canMove || loading}
                            className={canMove ? "piece-hover" : ""}
                            style={{
                              padding: "1.5rem",
                              background: canMove 
                                ? `radial-gradient(circle at 30% 30%, ${getColorStyle(currentPlayer.color)}FF, ${getColorStyle(currentPlayer.color)}CC)`
                                : "var(--bg-overlay-05)",
                              border: `3px solid ${canMove ? getColorStyle(currentPlayer.color) : "var(--border-overlay-1)"}`,
                              borderRadius: "16px",
                              color: canMove ? "white" : "var(--text-secondary)",
                              cursor: canMove && !loading ? "pointer" : "not-allowed",
                              fontWeight: "700",
                              fontSize: "1rem",
                              opacity: canMove ? 1 : 0.4,
                              boxShadow: canMove 
                                ? `0 8px 24px ${getColorStyle(currentPlayer.color)}50, inset 0 2px 8px rgba(255,255,255,0.3)`
                                : "none",
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              position: "relative",
                              overflow: "hidden",
                            }}
                            onMouseEnter={(e) => {
                              if (canMove && !loading) {
                                e.currentTarget.style.transform = "scale(1.1) translateY(-5px)";
                                e.currentTarget.style.boxShadow = `0 12px 32px ${getColorStyle(currentPlayer.color)}70, inset 0 2px 8px rgba(255,255,255,0.4)`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (canMove) {
                                e.currentTarget.style.transform = "scale(1) translateY(0)";
                                e.currentTarget.style.boxShadow = `0 8px 24px ${getColorStyle(currentPlayer.color)}50, inset 0 2px 8px rgba(255,255,255,0.3)`;
                              }
                            }}
                          >
                            <div style={{ 
                              fontSize: "1.25rem", 
                              marginBottom: "0.5rem",
                              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                            }}>
                              🎯 Ficha {idx + 1}
                            </div>
                            <div style={{ 
                              fontSize: "0.875rem", 
                              opacity: 0.9,
                              fontWeight: "500",
                            }}>
                              {piece === 0 ? "🏠 En casa" : piece === 69 ? "🏆 Meta" : `📍 Casilla ${piece}`}
                            </div>
                            {canMove && (
                              <div style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                width: "100%",
                                height: "100%",
                                background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
                                pointerEvents: "none",
                                animation: "pulse 2s ease-in-out infinite",
                              }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Botón de pasar turno - solo si no tienes fichas y sacaste menos de 5 */}
                    {(() => {
                      const hasPiecesInPlay = currentPlayer.pieces.some(p => p > 0 && p < 69);
                      const canPassTurn = !hasPiecesInPlay && currentGame.last_dice < 5;
                      
                      if (canPassTurn) {
                        return (
                          <button
                            onClick={async () => {
                              // Pasar turno llamando a move-piece con un índice especial o creando un endpoint
                              // Por ahora, vamos a crear una función que llame a un endpoint de pasar turno
                              setLoading(true);
                              try {
                                // Simular pasar turno moviendo una ficha inexistente o creando endpoint
                                // Por ahora, simplemente recargamos el juego y el backend debería pasar el turno automáticamente
                                // después de un tiempo, pero mejor crear un endpoint específico
                                const response = await fetch("/api/study-agents/pass-turn", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    game_id: currentGame.game_id,
                                    user_id: userId,
                                  }),
                                });
                                
                                if (response.ok) {
                                  const data = await response.json();
                                  if (data.success) {
                                    setCurrentGame(data.game);
                                  }
                                } else {
                                  const errorData = await response.json();
                                  alert(errorData.detail || "Error al pasar turno");
                                }
                              } catch (error) {
                                console.error("Error pasando turno:", error);
                                alert("Error al pasar turno");
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            style={{
                              width: "100%",
                              padding: "1rem",
                              background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                              color: "white",
                              border: "none",
                              borderRadius: "12px",
                              cursor: loading ? "not-allowed" : "pointer",
                              fontWeight: "700",
                              fontSize: "1rem",
                              boxShadow: "0 4px 12px rgba(107, 114, 128, 0.3)",
                              marginTop: "1rem",
                            }}
                          >
                            ⏭️ Pasar Turno
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Tablero de Parchís real */}
            <div style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(236, 72, 153, 0.05) 100%)",
              borderRadius: "24px",
              padding: "2.5rem",
              border: "3px solid rgba(99, 102, 241, 0.3)",
              boxShadow: `
                0 12px 40px rgba(0,0,0,0.15),
                0 0 60px rgba(99, 102, 241, 0.1),
                inset 0 2px 8px rgba(255,255,255,0.1)
              `,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                top: "-50%",
                left: "-50%",
                width: "200%",
                height: "200%",
                background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
                animation: "pulse 4s ease-in-out infinite",
                pointerEvents: "none",
              }} />
              <h3 style={{ 
                fontSize: "1.75rem", 
                fontWeight: "800", 
                color: "var(--text-primary)", 
                marginBottom: "2rem",
                textAlign: "center",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                position: "relative",
                zIndex: 1,
              }}>
                🎮 Tablero de Parchís
              </h3>
              
              {/* Tablero de Parchís real - diseño simplificado pero correcto */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(17, 1fr)",
                gridTemplateRows: "repeat(17, 1fr)",
                gap: "0.4rem",
                background: "#8B4513",
                padding: "1.5rem",
                borderRadius: "20px",
                border: "4px solid #654321",
                boxShadow: `
                  inset 0 4px 12px rgba(0,0,0,0.3),
                  0 0 40px rgba(99, 102, 241, 0.1)
                `,
                position: "relative",
                zIndex: 1,
                aspectRatio: "1",
                maxWidth: "900px",
                margin: "0 auto",
              }}>
                {(() => {
                  // Mapeo del tablero de Parchís real (17x17)
                  const board: (number | {type: string, color?: string} | null)[][] = [];
                  for (let r = 0; r < 17; r++) {
                    board[r] = [];
                    for (let c = 0; c < 17; c++) {
                      board[r][c] = null;
                    }
                  }
                  
                  // Definir casas circulares en las esquinas (6x6 cada una)
                  // Rojo: top-left (0-5, 0-5)
                  for (let r = 0; r < 6; r++) {
                    for (let c = 0; c < 6; c++) {
                      if (Math.sqrt((r-2.5)**2 + (c-2.5)**2) < 3) {
                        board[r][c] = {type: "home", color: "red"};
                      }
                    }
                  }
                  
                  // Azul: top-right (0-5, 11-16)
                  for (let r = 0; r < 6; r++) {
                    for (let c = 11; c < 17; c++) {
                      if (Math.sqrt((r-2.5)**2 + (c-13.5)**2) < 3) {
                        board[r][c] = {type: "home", color: "blue"};
                      }
                    }
                  }
                  
                  // Verde: bottom-left (11-16, 0-5)
                  for (let r = 11; r < 17; r++) {
                    for (let c = 0; c < 6; c++) {
                      if (Math.sqrt((r-13.5)**2 + (c-2.5)**2) < 3) {
                        board[r][c] = {type: "home", color: "green"};
                      }
                    }
                  }
                  
                  // Amarillo: bottom-right (11-16, 11-16)
                  for (let r = 11; r < 17; r++) {
                    for (let c = 11; c < 17; c++) {
                      if (Math.sqrt((r-13.5)**2 + (c-13.5)**2) < 3) {
                        board[r][c] = {type: "home", color: "yellow"};
                      }
                    }
                  }
                  
                  // Centro (meta) - área 7x7 en el centro (5-11, 5-11)
                  for (let r = 5; r < 12; r++) {
                    for (let c = 5; c < 12; c++) {
                      if (r === 8 && c === 8) {
                        board[r][c] = {type: "center"};
                      } else if (r >= 5 && r <= 11 && c >= 5 && c <= 11) {
                        board[r][c] = {type: "center_path"};
                      }
                    }
                  }
                  
                  // Camino principal alrededor del tablero (68 casillas)
                  // Empezar desde la casilla de salida de cada color
                  // Rojo: casilla 1 (posición 6, 6) - camino hacia la derecha
                  let cellNum = 1;
                  
                  // Camino principal alrededor del tablero (68 casillas numeradas)
                  // Empezar desde la salida roja (6, 6) y seguir en sentido horario
                  
                  // Camino superior (derecha): 1-8 (desde 6,6 hasta 6,13)
                  for (let i = 0; i < 8; i++) {
                    const col = 6 + i;
                    if (col < 17) {
                      board[6][col] = cellNum++;
                    }
                  }
                  
                  // Camino derecho (abajo): 9-16 (desde 7,14 hasta 14,14)
                  for (let i = 0; i < 8; i++) {
                    const row = 7 + i;
                    if (row < 17) {
                      board[row][14] = cellNum++;
                    }
                  }
                  
                  // Camino inferior (izquierda): 17-26 (desde 15,13 hasta 15,4)
                  for (let i = 0; i < 10; i++) {
                    const col = 13 - i;
                    if (col >= 0) {
                      board[15][col] = cellNum++;
                    }
                  }
                  
                  // Camino izquierdo (arriba): 27-34 (desde 14,0 hasta 7,0)
                  for (let i = 0; i < 8; i++) {
                    const row = 14 - i;
                    if (row >= 0) {
                      board[row][0] = cellNum++;
                    }
                  }
                  
                  // Camino superior (derecha): 35-42 (desde 6,1 hasta 6,8)
                  for (let i = 0; i < 8; i++) {
                    const col = 1 + i;
                    if (col < 17) {
                      board[6][col] = cellNum++;
                    }
                  }
                  
                  // Camino derecho hacia centro (abajo): 43-50 (desde 5,6 hasta 0,6, luego hacia arriba)
                  // Primero bajar desde fila 5 hasta fila 0
                  for (let i = 0; i < 6; i++) {
                    const row = 5 - i;
                    if (row >= 0 && row < 17) {
                      board[row][6] = cellNum++;
                    }
                  }
                  
                  // Luego continuar en la fila 0 hacia la izquierda: 49-52
                  for (let i = 1; i < 5; i++) {
                    const col = 5 - i;
                    if (col >= 0 && col < 17) {
                      board[0][col] = cellNum++;
                    }
                  }
                  
                  // Camino inferior (izquierda): 53-59 (continuar en fila 0 hacia la derecha)
                  for (let i = 1; i < 7; i++) {
                    if (i < 17) {
                      board[0][i] = cellNum++;
                    }
                  }
                  
                  // Camino izquierdo (arriba): 60-68 (desde fila 1 hasta fila 8, columna 6)
                  for (let i = 1; i < 10; i++) {
                    if (i < 17) {
                      board[i][6] = cellNum++;
                    }
                  }
                  
                  // Renderizar el tablero
                  const cells: React.ReactElement[] = [];
                  for (let row = 0; row < 17; row++) {
                    for (let col = 0; col < 17; col++) {
                      const cell = board[row][col];
                      const cellNumber = typeof cell === 'number' ? cell : null;
                      const cellType = typeof cell === 'object' && cell ? cell.type : null;
                      const cellColor = typeof cell === 'object' && cell && 'color' in cell ? cell.color : null;
                      
                      const piecesHere = cellNumber ? currentGame.players.flatMap(p => {
                        if (!p || !p.color || !p.pieces) return [];
                        return p.pieces.map((pos, idx) => ({ pos, color: p.color, idx }));
                      }).filter(p => p && p.pos === cellNumber) : [];
                      
                      const isHome = cellType === "home";
                      const isCenter = cellType === "center" || cellType === "center_path";
                      
                      cells.push(
                        <div
                          key={`${row}-${col}`}
                          className={`board-cell ${piecesHere.length > 0 ? "has-piece" : ""}`}
                          style={{
                            aspectRatio: "1",
                            background: isHome
                              ? `radial-gradient(circle, ${getColorStyle(cellColor || "red")}50 0%, ${getColorStyle(cellColor || "red")}30 50%, transparent 100%)`
                              : isCenter
                              ? "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 100%)"
                              : cellNumber
                              ? piecesHere.length > 0 && piecesHere[0]?.color
                                ? `radial-gradient(circle at center, ${getColorStyle(piecesHere[0].color)}40 0%, ${getColorStyle(piecesHere[0].color)}20 50%, transparent 100%)`
                                : "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)"
                              : "transparent",
                            border: isHome
                              ? `3px solid ${getColorStyle(cellColor || "red")}`
                              : isCenter
                              ? "2px solid rgba(99, 102, 241, 0.4)"
                              : cellNumber
                              ? piecesHere.length > 0 && piecesHere[0]?.color
                                ? `2px solid ${getColorStyle(piecesHere[0].color)}`
                                : "2px solid rgba(255,255,255,0.3)"
                              : "none",
                            borderRadius: isHome ? "50%" : "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: cellNumber ? "0.55rem" : "0.4rem",
                            fontWeight: "700",
                            color: cellNumber
                              ? piecesHere.length > 0 && piecesHere[0]?.color
                                ? getColorStyle(piecesHere[0].color)
                                : "white"
                              : "transparent",
                            position: "relative",
                            boxShadow: piecesHere.length > 0 && piecesHere[0]?.color
                              ? `0 4px 12px ${getColorStyle(piecesHere[0].color)}60, inset 0 2px 4px rgba(255,255,255,0.2)`
                              : cellNumber
                              ? "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.15)"
                              : "none",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        >
                          {cellNumber && (
                            <span style={{ 
                              zIndex: 1,
                              textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                            }}>
                              {cellNumber}
                            </span>
                          )}
                          {piecesHere.length > 0 && (
                            piecesHere.map((p, i) => {
                              if (!p || !p.color) return null;
                              return (
                                <div
                                  key={i}
                                  className="piece"
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "50%",
                                    background: `radial-gradient(circle at 30% 30%, ${getColorStyle(p.color)}FF 0%, ${getColorStyle(p.color)}DD 40%, ${getColorStyle(p.color)}AA 100%)`,
                                    border: `2px solid white`,
                                    position: "absolute",
                                    top: `${12 + i * 28}%`,
                                    left: `${12 + i * 28}%`,
                                    boxShadow: `
                                      0 4px 12px ${getColorStyle(p.color)}80,
                                      0 2px 6px rgba(0,0,0,0.4),
                                      inset 0 2px 4px rgba(255,255,255,0.5)
                                    `,
                                    zIndex: 10 + i,
                                  }}
                                />
                              );
                            })
                          )}
                        </div>
                      );
                    }
                  }
                  
                  return cells;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista de lista de partidas
  return (
    <>
      <style>{styles}</style>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Juegos Multijugador
        </h2>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => {
              setShowJoinModal(true);
              setSelectedGameId(null);
              setInviteCode("");
            }}
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "600",
              opacity: loading ? 0.6 : 1,
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
            title="Unirse a una partida usando código de invitación"
          >
            <HiUsers size={20} />
            Unirse con Código
          </button>
          <button
            onClick={deleteAllUserGames}
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              color: "#ef4444",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "600",
              opacity: loading ? 0.6 : 1,
            }}
            title="Eliminar todas tus partidas antiguas en este curso"
          >
            <HiXMark size={20} />
            Limpiar Partidas
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "600",
            }}
          >
            <HiPlay size={20} />
            Crear Partida
          </button>
        </div>
      </div>

      {/* Lista de partidas */}
      <div style={{ display: "grid", gap: "1rem" }}>
        {games.length === 0 ? (
          <div style={{
            background: "var(--bg-card)",
            borderRadius: "16px",
            padding: "3rem",
            textAlign: "center",
            border: "1px solid var(--border-overlay-1)",
          }}>
            <HiTrophy size={48} color="var(--text-secondary)" style={{ marginBottom: "1rem" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "1.125rem" }}>
              No hay partidas disponibles. ¡Crea una para empezar!
            </p>
          </div>
        ) : (
          games.map((game) => {
            const isInGame = game.players.some(p => p.user_id === userId);
            const canJoin = game.status === "waiting" && !isInGame && game.players.length < game.max_players;
            
            return (
              <div
                key={game.game_id}
                style={{
                  background: "var(--bg-card)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  border: "1px solid var(--border-overlay-1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                    <div style={{
                      padding: "0.5rem 1rem",
                      background: game.status === "waiting" ? "rgba(251, 191, 36, 0.1)" : game.status === "playing" ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)",
                      color: game.status === "waiting" ? "#fbbf24" : game.status === "playing" ? "#10b981" : "#6b7280",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                    }}>
                      {game.status === "waiting" ? "Esperando" : game.status === "playing" ? "En juego" : "Finalizada"}
                    </div>
                    {game.topic_filter && (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        Tema: {game.topic_filter}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <HiUsers size={16} />
                      {game.players.length}/{game.max_players} jugadores
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {isInGame ? (
                    <button
                      onClick={() => loadGame(game.game_id)}
                      style={{
                        padding: "0.75rem 1.5rem",
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      Entrar
                    </button>
                  ) : canJoin ? (
                    <button
                      onClick={() => {
                        setSelectedGameId(game.game_id);
                        setShowJoinModal(true);
                      }}
                      disabled={loading}
                      style={{
                        padding: "0.75rem 1.5rem",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontWeight: "600",
                      }}
                    >
                      Unirse
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal crear partida */}
      {showCreateModal && (
        <div
          style={{
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
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "var(--text-primary)" }}>
                Crear Partida
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
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-primary)", fontWeight: "500" }}>
                  Número de jugadores
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "var(--bg-overlay-05)",
                    border: "1px solid var(--border-overlay-1)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value={2}>2 jugadores</option>
                  <option value={3}>3 jugadores</option>
                  <option value={4}>4 jugadores</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-primary)", fontWeight: "500" }}>
                  Filtrar por tema (opcional)
                </label>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "var(--bg-overlay-05)",
                    border: "1px solid var(--border-overlay-1)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Todos los temas</option>
                  {course.topics.map((topic) => (
                    <option key={topic.name} value={topic.name}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={createGame}
                disabled={loading}
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "1.125rem",
                }}
              >
                {loading ? "Creando..." : "Crear Partida"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal unirse con código */}
      {showJoinModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowJoinModal(false);
              setInviteCode("");
              setSelectedGameId(null);
            }
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "20px",
              padding: "2.5rem",
              maxWidth: "500px",
              width: "90%",
              border: "2px solid var(--border-overlay-1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "var(--text-primary)" }}>
                Unirse a Partida
              </h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setInviteCode("");
                  setSelectedGameId(null);
                }}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {selectedGameId ? (
                <>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Si no estás inscrito en el curso, ingresa el código de invitación que te compartió el creador de la partida.
                  </p>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-primary)", fontWeight: "500" }}>
                      Código de Invitación (opcional)
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Ej: ABC123"
                      maxLength={6}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && inviteCode.length === 6) {
                          joinGame(selectedGameId, inviteCode || undefined);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        background: "var(--bg-overlay-05)",
                        border: "2px solid var(--border-overlay-1)",
                        borderRadius: "12px",
                        color: "var(--text-primary)",
                        fontSize: "1.5rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        textAlign: "center",
                        fontWeight: "700",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      joinGame(selectedGameId, inviteCode || undefined);
                    }}
                    disabled={loading}
                    style={{
                      padding: "1rem",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: "700",
                      fontSize: "1.125rem",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    {loading ? "Uniéndose..." : "Unirse a la Partida"}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                    Ingresa el código de invitación de 6 caracteres para unirte directamente a una partida.
                  </p>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-primary)", fontWeight: "600", fontSize: "1rem" }}>
                      Código de Invitación
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      placeholder="ABC123"
                      maxLength={6}
                      onKeyPress={async (e) => {
                        if (e.key === "Enter" && inviteCode.length === 6) {
                          setLoading(true);
                          try {
                            // Buscar partida por código en el backend
                            const response = await fetch("/api/study-agents/find-game-by-code", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                invite_code: inviteCode.toUpperCase(),
                                user_id: userId,
                              }),
                            });

                            if (response.ok) {
                              const data = await response.json();
                              if (data.success && data.game) {
                                // Unirse a la partida encontrada
                                await joinGame(data.game.game_id, inviteCode);
                              } else {
                                alert("No se encontró ninguna partida con ese código.");
                              }
                            } else {
                              const errorData = await response.json();
                              alert(errorData.error || errorData.detail || "No se encontró ninguna partida con ese código.");
                            }
                          } catch (error) {
                            console.error("Error buscando partida por código:", error);
                            alert("Error al buscar partida por código");
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "1.25rem",
                        background: "var(--bg-overlay-05)",
                        border: "2px solid var(--border-overlay-1)",
                        borderRadius: "12px",
                        color: "var(--text-primary)",
                        fontSize: "2rem",
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        textAlign: "center",
                        fontWeight: "900",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (inviteCode.length === 6) {
                        setLoading(true);
                        try {
                          // Buscar partida por código en el backend
                          const response = await fetch("/api/study-agents/find-game-by-code", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              invite_code: inviteCode.toUpperCase(),
                              user_id: userId,
                            }),
                          });

                          if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.game) {
                              // Unirse a la partida encontrada
                              await joinGame(data.game.game_id, inviteCode);
                            } else {
                              alert("No se encontró ninguna partida con ese código.");
                            }
                          } else {
                            const errorData = await response.json();
                            alert(errorData.error || errorData.detail || "No se encontró ninguna partida con ese código.");
                          }
                        } catch (error) {
                          console.error("Error buscando partida por código:", error);
                          alert("Error al buscar partida por código");
                        } finally {
                          setLoading(false);
                        }
                      } else {
                        alert("Por favor, ingresa un código de 6 caracteres");
                      }
                    }}
                    disabled={loading || inviteCode.length !== 6}
                    style={{
                      padding: "1rem",
                      background: inviteCode.length === 6 
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "var(--bg-overlay-05)",
                      color: inviteCode.length === 6 ? "white" : "var(--text-secondary)",
                      border: "none",
                      borderRadius: "12px",
                      cursor: (loading || inviteCode.length !== 6) ? "not-allowed" : "pointer",
                      fontWeight: "700",
                      fontSize: "1.125rem",
                      boxShadow: inviteCode.length === 6 ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {loading ? "Buscando..." : inviteCode.length === 6 ? "Unirse con Código" : "Ingresa 6 caracteres"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

