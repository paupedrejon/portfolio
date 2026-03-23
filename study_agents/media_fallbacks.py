"""
Búsqueda de medios sin depender solo de API keys de pago.
- Wikimedia Commons (imágenes): API pública, requiere User-Agent descriptivo.
- YouTube: extraer videoId del HTML de resultados o de ytInitialData.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

import requests

WIKIMEDIA_UA = "StudyAgents/1.0 (educational study app; local development)"
YOUTUBE_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def _collect_video_ids(obj: Any, out: List[str], limit: int = 12) -> None:
    if len(out) >= limit:
        return
    if isinstance(obj, dict):
        vid = obj.get("videoId")
        if isinstance(vid, str) and len(vid) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", vid):
            if vid not in out:
                out.append(vid)
        for v in obj.values():
            _collect_video_ids(v, out, limit)
    elif isinstance(obj, list):
        for item in obj:
            _collect_video_ids(item, out, limit)


def _extract_yt_initial_data_json(html: str) -> Optional[dict]:
    """Parsea el objeto ytInitialData embebido en la página (llaves balanceadas)."""
    markers = ("var ytInitialData = ", "ytInitialData = ")
    start_search = 0
    for key in markers:
        idx = html.find(key, start_search)
        if idx >= 0:
            brace = html.find("{", idx + len(key))
            if brace < 0:
                return None
            depth = 0
            for i in range(brace, len(html)):
                c = html[i]
                if c == "{":
                    depth += 1
                elif c == "}":
                    depth -= 1
                    if depth == 0:
                        blob = html[brace : i + 1]
                        try:
                            return json.loads(blob)
                        except json.JSONDecodeError:
                            return None
            return None
    return None


def youtube_video_id_from_search_html(html: str) -> Optional[str]:
    """Obtiene un videoId desde la página de resultados de YouTube."""
    if not html or len(html) < 500:
        return None

    # 1) ytInitialData (JSON embebido con llaves balanceadas)
    data = _extract_yt_initial_data_json(html)
    if data is not None:
        ids: List[str] = []
        _collect_video_ids(data, ids)
        if ids:
            return ids[0]

    # 2) Regex sobre el HTML crudo
    patterns = [
        r'"videoId":"([a-zA-Z0-9_-]{11})"',
        r"'videoId':'([a-zA-Z0-9_-]{11})'",
        r"watch\?v=([a-zA-Z0-9_-]{11})",
        r"/embed/([a-zA-Z0-9_-]{11})",
    ]
    for pat in patterns:
        for vid in re.findall(pat, html):
            if len(vid) == 11:
                return vid
    return None


def search_youtube_via_scrape(query: str, timeout: float = 12) -> Optional[Dict[str, str]]:
    """Primera coincidencia en la página de búsqueda de YouTube (sin API key)."""
    q = " ".join(query.split()).strip()
    if not q:
        return None
    try:
        url = f"https://www.youtube.com/results?search_query={requests.utils.quote(q)}"
        headers = {
            "User-Agent": YOUTUBE_UA,
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
            "Accept": "text/html,application/xhtml+xml",
        }
        r = requests.get(url, headers=headers, timeout=timeout)
        r.raise_for_status()
        vid = youtube_video_id_from_search_html(r.text)
        if vid:
            return {
                "videoId": vid,
                "title": q[:120],
                "description": "",
                "url": f"https://www.youtube.com/watch?v={vid}",
            }
    except Exception as e:
        print(f"⚠️ YouTube scrape: {e}")
    return None


def search_wikimedia_commons_image(query: str, timeout: float = 14) -> Optional[Dict[str, str]]:
    """Una imagen de Wikimedia Commons relacionada con la consulta (sin API key propia)."""
    q = " ".join(query.split()).strip()[:240]
    if not q:
        return None
    headers = {"User-Agent": WIKIMEDIA_UA}
    try:
        r = requests.get(
            "https://commons.wikimedia.org/w/api.php",
            params={
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": q,
                "srnamespace": 6,
                "srlimit": 8,
            },
            headers=headers,
            timeout=timeout,
        )
        r.raise_for_status()
        hits = r.json().get("query", {}).get("search", [])
        for hit in hits:
            title = hit.get("title") or ""
            if not title.startswith("File:"):
                continue
            r2 = requests.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action": "query",
                    "format": "json",
                    "titles": title,
                    "prop": "imageinfo",
                    "iiprop": "url|mime|thumburl",
                    "iiurlwidth": 1024,
                },
                headers=headers,
                timeout=timeout,
            )
            r2.raise_for_status()
            pages = r2.json().get("query", {}).get("pages", {})
            for _pid, page in pages.items():
                for ii in page.get("imageinfo") or []:
                    mime = (ii.get("mime") or "").lower()
                    if "svg" in mime or not mime.startswith("image/"):
                        continue
                    img_url = ii.get("thumburl") or ii.get("url")
                    if not img_url:
                        continue
                    desc = title.replace("File:", "").replace("_", " ")[:220]
                    return {
                        "url": img_url,
                        "description": desc,
                        "source": "Wikimedia Commons",
                    }
    except Exception as e:
        print(f"⚠️ Wikimedia Commons: {e}")
    return None


def shorten_search_query(query: str, max_len: int = 100) -> str:
    """Evita queries enormes del LLM que rompen búsquedas."""
    q = " ".join(query.split()).strip()
    if len(q) <= max_len:
        return q
    return q[: max_len - 1].rsplit(" ", 1)[0] or q[:max_len]
