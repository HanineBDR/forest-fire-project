"""
INKAD Neon Database Helper (Python)
Executes SQL on Neon Lakebase Postgres using Neon Serverless HTTP API,
with automatic fallback to local SQLite for offline/sandboxed execution.
"""

import os
import json
import sqlite3
import urllib.parse
import re
from typing import List, Dict, Any, Optional

try:
    import httpx
except ImportError:
    httpx = None

try:
    import requests
except ImportError:
    requests = None


def get_neon_connection_info() -> Optional[Dict[str, str]]:
    """Extracts Neon connection info from DATABASE_URL or environment files."""
    db_url = os.environ.get("DATABASE_URL_UNPOOLED") or os.environ.get("DATABASE_URL")
    if not db_url:
        candidates = ["backend/.env", "frontend/.env.local", ".env"]
        for c in candidates:
            if os.path.exists(c):
                try:
                    with open(c, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("DATABASE_URL="):
                                val = line.split("=", 1)[1].strip()
                                if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                                    val = val[1:-1]
                                db_url = val
                                break
                except Exception:
                    pass
            if db_url:
                break

    if not db_url:
        return None

    try:
        p = urllib.parse.urlsplit(db_url)
        host = (p.hostname or "").replace("-pooler", "")
        return {
            "host": host,
            "username": p.username or "neondb_owner",
            "password": p.password or "",
            "database": (p.path or "/neondb").lstrip("/"),
            "url": f"https://{host}/sql" if host else None
        }
    except Exception:
        return None


def execute_neon_sql(query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
    """
    Executes a SQL query on Neon Postgres via HTTPS.
    Returns list of dicts. Falls back to local SQLite if unreachable.
    """
    if os.environ.get("TESTING") == "1":
        return _execute_sqlite_fallback(query, params)
    info = get_neon_connection_info()
    if info and info.get("url") and info.get("password"):
        try:
            payload = {"query": query}
            if params:
                payload["params"] = params
            headers = {
                "Authorization": f"Bearer {info['password']}",
                "Content-Type": "application/json"
            }
            if httpx:
                with httpx.Client(timeout=2.0) as client:
                    resp = client.post(info["url"], json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        if isinstance(data, dict) and "rows" in data:
                            return data["rows"]
                        if isinstance(data, list):
                            return data
            elif requests:
                resp = requests.post(info["url"], json=payload, headers=headers, timeout=2.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, dict) and "rows" in data:
                        return data["rows"]
                    if isinstance(data, list):
                        return data
        except Exception:
            pass

    # Local SQLite Fallback
    return _execute_sqlite_fallback(query, params)


def _execute_sqlite_fallback(query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
    """Local SQLite fallback for sandboxed tests or offline operations."""
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "inkad_history.db")


    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Ensure tables exist in SQLite too
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT,
        sender_role TEXT,
        recipient_role TEXT,
        recipient_user_id TEXT,
        title TEXT,
        message TEXT,
        risk_level TEXT,
        risk_score REAL,
        massif TEXT,
        wilaya TEXT,
        lat REAL,
        lon REAL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alert_acknowledgments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT,
        user_role TEXT,
        action TEXT,
        comment TEXT,
        target_role TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT UNIQUE,
        lat REAL,
        lon REAL,
        wilaya TEXT,
        forest_name TEXT,
        risk_score REAL,
        risk_level TEXT,
        temp REAL,
        humidity REAL,
        wind REAL,
        wind_dir TEXT,
        status TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    )
    """)
    conn.commit()

    # Adjust query for SQLite
    sql = query.replace("NOW()", "datetime('now')")
    sql = re.sub(r'\bFALSE\b', '0', sql, flags=re.IGNORECASE)
    sql = re.sub(r'\bTRUE\b', '1', sql, flags=re.IGNORECASE)

    # Map indexed params $1, $2 to positional ?
    sqlite_params = []
    if params:
        param_matches = list(re.finditer(r'\$(\d+)', sql))
        if param_matches:
            for m in param_matches:
                idx = int(m.group(1)) - 1
                if 0 <= idx < len(params):
                    sqlite_params.append(params[idx])
                else:
                    sqlite_params.append(None)
            sql = re.sub(r'\$\d+', '?', sql)
        else:
            sqlite_params = params

    is_select = sql.strip().upper().startswith("SELECT")
    if not is_select:
        # Strip RETURNING clause for SQLite
        sql = re.sub(r'\s+RETURNING\s+.*', '', sql, flags=re.IGNORECASE)

    try:
        if sqlite_params:
            cursor.execute(sql, sqlite_params)
        else:
            cursor.execute(sql)
        
        if is_select:
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return rows
        else:
            conn.commit()
            last_id = cursor.lastrowid
            conn.close()
            return [{"id": last_id}]
    except Exception as ex:
        conn.close()
        return []
