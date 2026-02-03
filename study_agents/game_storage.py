"""
Sistema de almacenamiento de Juegos (Parchís con preguntas del curso)
Gestiona partidas multijugador online
"""

import json
import os
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path
import uuid

# Directorio para almacenar partidas (usar ruta absoluta basada en el directorio del módulo)
_module_dir = Path(os.path.dirname(os.path.abspath(__file__)))
GAMES_DIR = _module_dir.parent / "courses" / "games"
GAMES_DIR.mkdir(parents=True, exist_ok=True)


def get_game_file(game_id: str) -> Path:
    """Obtiene la ruta del archivo de una partida"""
    return GAMES_DIR / f"{game_id}.json"


def create_game(
    course_id: str,
    creator_id: str,
    max_players: int = 4,
    topic_filter: Optional[str] = None  # Filtrar preguntas por tema específico
) -> Dict:
    """
    Crea una nueva partida de parchís
    
    Args:
        course_id: ID del curso
        creator_id: ID del usuario creador de la partida
        max_players: Número máximo de jugadores (2-4)
        topic_filter: Tema específico para las preguntas (opcional)
        
    Returns:
        Datos de la partida creada
    """
    game_id = f"game_{uuid.uuid4().hex[:12]}"
    
    # Generar código de invitación (6 caracteres alfanuméricos)
    invite_code = uuid.uuid4().hex[:6].upper()
    
    # Colores del parchís: rojo, azul, amarillo, verde
    colors = ["red", "blue", "yellow", "green"][:max_players]
    
    game_data = {
        "game_id": game_id,
        "course_id": course_id,
        "creator_id": creator_id,
        "max_players": max_players,
        "topic_filter": topic_filter,
        "invite_code": invite_code,  # Código para invitar a usuarios no inscritos
        "status": "waiting",  # waiting, playing, finished
        "players": [
            {
                "user_id": creator_id,
                "color": colors[0],
                "position": 0,  # Posición en el tablero (0-68)
                "pieces": [0, 0, 0, 0],  # Posiciones de las 4 fichas (0 = en casa, 1-68 = en tablero, 69 = meta)
                "score": 0,  # Preguntas correctas
                "joined_at": datetime.now().isoformat()
            }
        ],
        "current_turn": 0,  # Índice del jugador actual
        "last_dice": None,  # Último dado lanzado
        "current_question": None,  # Pregunta actual si hay una activa
        "question_history": [],  # Historial de preguntas
        "preloaded_questions": [],  # Banco de preguntas pre-cargadas
        "question_index": 0,  # Índice de la siguiente pregunta a usar
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "winner": None  # user_id del ganador
    }
    
    # Guardar partida
    save_game(game_data)
    
    return game_data


def save_game(game_data: Dict) -> bool:
    """Guarda una partida"""
    try:
        game_file = get_game_file(game_data["game_id"])
        print(f"[Save Game] Guardando partida {game_data.get('game_id')} en {game_file.absolute()}")
        print(f"[Save Game] Código de invitación: {game_data.get('invite_code')}")
        with open(game_file, "w", encoding="utf-8") as f:
            json.dump(game_data, f, indent=2, ensure_ascii=False)
        print(f"[Save Game] ✅ Partida guardada correctamente")
        return True
    except Exception as e:
        print(f"[Save Game] ❌ Error guardando partida: {e}")
        import traceback
        traceback.print_exc()
        return False


def load_game(game_id: str) -> Optional[Dict]:
    """Carga una partida"""
    try:
        game_file = get_game_file(game_id)
        if not game_file.exists():
            print(f"[Load Game] ❌ Archivo no existe: {game_file.absolute()}")
            return None
        
        with open(game_file, "r", encoding="utf-8") as f:
            game = json.load(f)
            return game
    except Exception as e:
        print(f"[Load Game] ❌ Error cargando partida: {e}")
        import traceback
        traceback.print_exc()
        return None


def join_game(game_id: str, user_id: str, username: Optional[str] = None, invite_code: Optional[str] = None) -> Optional[Dict]:
    """
    Une un jugador a una partida
    
    Args:
        game_id: ID de la partida
        user_id: ID del usuario que se une
        username: Nombre del usuario (opcional)
        invite_code: Código de invitación (opcional, necesario para usuarios no inscritos)
    
    Returns:
        Datos de la partida actualizados o None si no se pudo unir
    """
    game = load_game(game_id)
    if not game:
        return None
    
    # Verificar que la partida esté esperando jugadores
    if game["status"] != "waiting":
        return None
    
    # Verificar que no esté llena
    if len(game["players"]) >= game["max_players"]:
        return None
    
    # Verificar que el jugador no esté ya en la partida
    existing_player = next((p for p in game["players"] if p["user_id"] == user_id), None)
    if existing_player:
        # Actualizar username si se proporciona
        if username:
            existing_player["username"] = username
            game["updated_at"] = datetime.now().isoformat()
            save_game(game)
        return game  # Ya está en la partida
    
    # Si se proporciona un código de invitación, verificar que sea correcto
    if invite_code and game.get("invite_code") != invite_code.upper():
        return None  # Código de invitación incorrecto
    
    # Añadir jugador
    colors = ["red", "blue", "yellow", "green"]
    used_colors = [p["color"] for p in game["players"]]
    available_colors = [c for c in colors[:game["max_players"]] if c not in used_colors]
    
    if not available_colors:
        return None
    
    new_player = {
        "user_id": user_id,
        "username": username or f"Jugador {len(game['players']) + 1}",
        "color": available_colors[0],
        "position": 0,
        "pieces": [0, 0, 0, 0],
        "score": 0,
        "joined_at": datetime.now().isoformat()
    }
    
    game["players"].append(new_player)
    game["updated_at"] = datetime.now().isoformat()
    
    save_game(game)
    return game


def start_game(game_id: str, user_id: str) -> Optional[Dict]:
    """
    Inicia una partida (debe tener al menos 2 jugadores y solo el creador puede iniciarla)
    
    Args:
        game_id: ID de la partida
        user_id: ID del usuario que intenta iniciar (debe ser el creador)
        
    Returns:
        Datos de la partida iniciada o None si no se pudo iniciar
    """
    game = load_game(game_id)
    if not game:
        return None
    
    if game["status"] != "waiting":
        return game  # Ya está iniciada o finalizada
    
    # Verificar que el usuario es el creador
    if game["creator_id"] != user_id:
        return None  # Solo el creador puede iniciar
    
    # Verificar que hay al menos 2 jugadores
    if len(game["players"]) < 2:
        return None  # Necesita al menos 2 jugadores
    
    # Verificar que no hay jugadores duplicados
    player_ids = [p["user_id"] for p in game["players"]]
    if len(player_ids) != len(set(player_ids)):
        return None  # Hay jugadores duplicados
    
    game["status"] = "playing"
    game["current_turn"] = 0
    game["updated_at"] = datetime.now().isoformat()
    
    save_game(game)
    return game


def get_course_games(course_id: str, status: Optional[str] = None) -> List[Dict]:
    """Obtiene todas las partidas de un curso"""
    games = []
    
    if not GAMES_DIR.exists():
        return games
    
    for game_file in GAMES_DIR.glob("*.json"):
        try:
            with open(game_file, "r", encoding="utf-8") as f:
                game = json.load(f)
                if game.get("course_id") == course_id:
                    if status is None or game.get("status") == status:
                        games.append(game)
        except:
            continue
    
    # Ordenar por fecha de creación (más recientes primero)
    games.sort(key=lambda g: g.get("created_at", ""), reverse=True)
    return games


def get_user_games(user_id: str, status: Optional[str] = None) -> List[Dict]:
    """Obtiene todas las partidas de un usuario"""
    games = []
    
    if not GAMES_DIR.exists():
        return games
    
    for game_file in GAMES_DIR.glob("*.json"):
        try:
            with open(game_file, "r", encoding="utf-8") as f:
                game = json.load(f)
                # Verificar si el usuario está en la partida
                if any(p.get("user_id") == user_id for p in game.get("players", [])):
                    if status is None or game.get("status") == status:
                        games.append(game)
        except:
            continue
    
    # Ordenar por fecha de actualización (más recientes primero)
    games.sort(key=lambda g: g.get("updated_at", ""), reverse=True)
    return games


def find_game_by_invite_code(invite_code: str) -> Optional[Dict]:
    """
    Busca una partida por su código de invitación
    
    Args:
        invite_code: Código de invitación (6 caracteres alfanuméricos)
        
    Returns:
        Datos de la partida o None si no se encuentra
    """
    invite_code_upper = invite_code.upper().strip()
    
    if not GAMES_DIR.exists():
        return None
    
    # Buscar en todos los archivos
    for game_file in GAMES_DIR.glob("*.json"):
        try:
            with open(game_file, "r", encoding="utf-8") as f:
                game = json.load(f)
                game_code = game.get("invite_code", "")
                game_status = game.get("status")
                
                # Comparar código de invitación (case-insensitive)
                if game_code and game_code.upper() == invite_code_upper:
                    # Solo devolver partidas en estado waiting
                    if game_status == "waiting":
                        return game
        except Exception as e:
            print(f"[Find Game by Code] Error procesando {game_file}: {e}")
            continue
    
    return None


def get_user_active_games(user_id: str, creator_only: bool = False) -> List[Dict]:
    """
    Obtiene las partidas activas (waiting o playing) de un usuario
    
    Args:
        user_id: ID del usuario
        creator_only: Si es True, solo devuelve partidas donde el usuario es el creador
    """
    if creator_only:
        # Buscar partidas donde el usuario es el creador
        games = []
        if not GAMES_DIR.exists():
            return games
        
        for game_file in GAMES_DIR.glob("*.json"):
            try:
                with open(game_file, "r", encoding="utf-8") as f:
                    game = json.load(f)
                    if game.get("creator_id") == user_id and game.get("status") in ["waiting", "playing"]:
                        games.append(game)
            except:
                continue
        return games
    else:
        all_games = get_user_games(user_id)
        return [g for g in all_games if g.get("status") in ["waiting", "playing"]]


def leave_game(game_id: str, user_id: str) -> Optional[Dict]:
    """
    Abandona una partida (waiting o playing)
    Si todos los jugadores abandonan, la partida se termina automáticamente
    
    Args:
        game_id: ID de la partida
        user_id: ID del usuario que abandona
        
    Returns:
        Datos de la partida actualizados o None si la partida fue eliminada/terminada
    """
    game = load_game(game_id)
    if not game:
        return None
    
    status = game.get("status")
    players = game.get("players", [])
    creator_id = game.get("creator_id")
    
    # Verificar que el usuario está en la partida
    if not any(str(p.get("user_id")) == str(user_id) for p in players):
        print(f"[Leave Game] Usuario {user_id} no está en la partida {game_id}")
        return None
    
    # Si es el creador y es el único jugador, eliminar la partida
    if str(creator_id) == str(user_id) and len(players) == 1:
        print(f"[Leave Game] Creador {user_id} abandona partida {game_id} (único jugador), eliminando partida")
        delete_game(game_id)
        return None
    
    # Remover jugador de la partida
    game["players"] = [p for p in players if str(p.get("user_id")) != str(user_id)]
    game["updated_at"] = datetime.now().isoformat()
    
    # Si no quedan jugadores, terminar/eliminar la partida
    if len(game["players"]) == 0:
        print(f"[Leave Game] Todos los jugadores abandonaron la partida {game_id}, eliminando partida")
        delete_game(game_id)
        return None
    
    # Si estaba en playing y ahora no hay suficientes jugadores, terminar la partida
    if status == "playing" and len(game["players"]) < 2:
        print(f"[Leave Game] Partida {game_id} en playing pero quedan menos de 2 jugadores, terminando partida")
        game["status"] = "finished"
        game["updated_at"] = datetime.now().isoformat()
        save_game(game)
        return game
    
    # Guardar cambios
    save_game(game)
    return game


def delete_game(game_id: str) -> bool:
    """Elimina una partida"""
    try:
        game_file = get_game_file(game_id)
        if game_file.exists():
            game_file.unlink()
            return True
        return False
    except Exception as e:
        print(f"Error eliminando partida: {e}")
        return False


def cleanup_abandoned_games(max_age_hours: int = 24, min_age_minutes: int = 30) -> int:
    """
    Limpia partidas abandonadas (waiting por más de X horas o con solo el creador)
    NO elimina partidas recién creadas (menos de min_age_minutes)
    
    Args:
        max_age_hours: Horas máximas que una partida puede estar en waiting
        min_age_minutes: Minutos mínimos que una partida debe tener antes de ser considerada abandonada
        
    Returns:
        Número de partidas eliminadas
    """
    if not GAMES_DIR.exists():
        return 0
    
    deleted_count = 0
    now = datetime.now()
    
    for game_file in GAMES_DIR.glob("*.json"):
        try:
            with open(game_file, "r", encoding="utf-8") as f:
                game = json.load(f)
                
            # Solo limpiar partidas en estado waiting
            if game.get("status") != "waiting":
                continue
            
            # Verificar antigüedad mínima (no eliminar partidas recién creadas)
            created_at_str = game.get("created_at")
            age_minutes = None
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(created_at_str)
                    age_minutes = (now - created_at).total_seconds() / 60
                    
                    # NO eliminar partidas recién creadas (menos de min_age_minutes)
                    if age_minutes < min_age_minutes:
                        continue  # Partida muy reciente, no eliminar
                except (ValueError, TypeError) as e:
                    # Si hay error parseando, no eliminar (mejor ser conservador)
                    continue
            
            should_delete = False
            
            # Eliminar si solo tiene el creador Y tiene más de min_age_minutes
            players = game.get("players", [])
            creator_id = game.get("creator_id")
            if len(players) == 1 and players[0].get("user_id") == creator_id:
                should_delete = True
                age_str = f"{age_minutes:.1f} minutos" if age_minutes is not None else "desconocida"
                print(f"[Cleanup] Eliminando partida {game.get('game_id')} - solo tiene al creador (antigüedad: {age_str})")
            
            # Verificar antigüedad máxima (eliminar partidas muy antiguas incluso si tienen jugadores)
            if not should_delete:
                if created_at_str:
                    try:
                        created_at = datetime.fromisoformat(created_at_str)
                        age_hours = (now - created_at).total_seconds() / 3600
                        
                        if age_hours > max_age_hours:
                            should_delete = True
                            print(f"[Cleanup] Eliminando partida {game.get('game_id')} - antigüedad {age_hours:.1f} horas")
                    except (ValueError, TypeError) as e:
                        print(f"[Cleanup] Error parseando fecha de partida {game.get('game_id')}: {e}")
            
            if should_delete:
                try:
                    game_file.unlink()
                    deleted_count += 1
                    print(f"[Cleanup] ✅ Eliminada partida {game.get('game_id')}")
                except Exception as e:
                    print(f"[Cleanup] ❌ Error eliminando archivo {game_file}: {e}")
        except Exception as e:
            print(f"[Cleanup] Error procesando {game_file}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    return deleted_count


def delete_user_games(user_id: str, course_id: Optional[str] = None) -> int:
    """
    Elimina todas las partidas de un usuario (creadas por él) o lo remueve de partidas (si no es creador y está en waiting)
    
    Args:
        user_id: ID del usuario
        course_id: ID del curso (opcional, si se proporciona solo elimina partidas de ese curso)
        
    Returns:
        Número de partidas eliminadas o jugadores removidos
    """
    if not GAMES_DIR.exists():
        print(f"[Delete User Games] GAMES_DIR no existe: {GAMES_DIR.absolute()}")
        return 0
    
    deleted_count = 0
    games_to_process = list(GAMES_DIR.glob("*.json"))  # Copia para evitar problemas al modificar
    
    print(f"[Delete User Games] Buscando partidas para usuario {user_id}, curso: {course_id}")
    print(f"[Delete User Games] Total de archivos encontrados: {len(games_to_process)}")
    
    for game_file in games_to_process:
        try:
            with open(game_file, "r", encoding="utf-8") as f:
                game = json.load(f)
            
            game_id = game.get("game_id", "unknown")
            game_creator_id = game.get("creator_id")
            game_status = game.get("status")
            game_course_id = game.get("course_id")
            
            print(f"[Delete User Games] Procesando partida {game_id}:")
            print(f"  - creator_id: '{game_creator_id}' (type: {type(game_creator_id).__name__})")
            print(f"  - user_id: '{user_id}' (type: {type(user_id).__name__})")
            print(f"  - status: '{game_status}'")
            print(f"  - course_id: '{game_course_id}'")
            print(f"  - match creator: {game_creator_id == user_id}")
            
            # Si se especifica course_id, solo procesar partidas de ese curso
            if course_id and game_course_id != course_id:
                print(f"[Delete User Games] ⏭️ Saltando partida {game_id} (curso diferente: {game_course_id} != {course_id})")
                continue
            
            # Si el usuario es el creador (comparación estricta)
            if str(game_creator_id) == str(user_id):
                print(f"[Delete User Games] ✅ Usuario {user_id} es creador de partida {game_id} (status: {game_status})")
                # Eliminar si está en waiting (siempre)
                if game_status == "waiting":
                    try:
                        game_file.unlink()
                        deleted_count += 1
                        print(f"[Delete User Games] ✅ Eliminada partida WAITING {game_id} creada por {user_id}")
                    except Exception as e:
                        print(f"[Delete User Games] ❌ Error eliminando archivo {game_file}: {e}")
                # Para partidas en playing: remover al creador y terminar la partida si no quedan jugadores
                elif game_status == "playing":
                    players = game.get("players", [])
                    print(f"[Delete User Games] Partida {game_id} en playing: {len(players)} jugadores total")
                    
                    # Remover al creador de la partida
                    game["players"] = [p for p in players if str(p.get("user_id")) != str(user_id)]
                    game["updated_at"] = datetime.now().isoformat()
                    
                    # Si no quedan jugadores, eliminar la partida
                    if len(game["players"]) == 0:
                        try:
                            game_file.unlink()
                            deleted_count += 1
                            print(f"[Delete User Games] ✅ Eliminada partida PLAYING {game_id} (creador removido, sin jugadores restantes)")
                        except Exception as e:
                            print(f"[Delete User Games] ❌ Error eliminando archivo {game_file}: {e}")
                    else:
                        # Si quedan jugadores, terminar la partida (marcar como finished)
                        game["status"] = "finished"
                        game["updated_at"] = datetime.now().isoformat()
                        save_game(game)
                        deleted_count += 1
                        print(f"[Delete User Games] ✅ Partida PLAYING {game_id} terminada (creador removido, {len(game['players'])} jugadores restantes)")
                else:
                    # Para otros estados (finished, etc), simplemente eliminar si es el creador
                    try:
                        game_file.unlink()
                        deleted_count += 1
                        print(f"[Delete User Games] ✅ Eliminada partida {game_status.upper()} {game_id} creada por {user_id}")
                    except Exception as e:
                        print(f"[Delete User Games] ❌ Error eliminando archivo {game_file}: {e}")
            else:
                print(f"[Delete User Games] ⏭️ Usuario {user_id} NO es creador de partida {game_id} (creator: {game_creator_id})")
                # Si el usuario no es el creador, intentar removerlo de la partida
                players = game.get("players", [])
                initial_player_count = len(players)
                game["players"] = [p for p in players if str(p.get("user_id")) != str(user_id)]
                
                if len(game["players"]) < initial_player_count:
                    # Usuario fue removido
                    game["updated_at"] = datetime.now().isoformat()
                    
                    # Si no quedan jugadores, eliminar la partida
                    if len(game["players"]) == 0:
                        try:
                            game_file.unlink()
                            deleted_count += 1
                            print(f"[Delete User Games] ✅ Eliminada partida {game_status.upper()} {game_id} (último jugador removido)")
                        except Exception as e:
                            print(f"[Delete User Games] ❌ Error eliminando archivo {game_file}: {e}")
                    else:
                        # Si quedan jugadores pero la partida está en playing y quedan menos de 2, terminarla
                        if game_status == "playing" and len(game["players"]) < 2:
                            game["status"] = "finished"
                            print(f"[Delete User Games] ✅ Partida PLAYING {game_id} terminada (quedan {len(game['players'])} jugadores)")
                        
                        save_game(game)
                        deleted_count += 1
                        print(f"[Delete User Games] ✅ Usuario {user_id} removido de partida {game_status.upper()} {game_id}")
                else:
                    print(f"[Delete User Games] ⏭️ Usuario {user_id} no está en jugadores de partida {game_id}")
                    
        except Exception as e:
            print(f"[Delete User Games] ❌ Error procesando {game_file}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    print(f"[Delete User Games] Total eliminadas/removidas: {deleted_count}")
    return deleted_count

