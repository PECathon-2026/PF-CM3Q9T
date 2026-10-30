"""Starlette backend application for AtmosphereIQ Weather Dashboard & Hello World."""

import os
import sqlite3
import subprocess
import sys
from typing import Any, Dict, List
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.templating import Jinja2Templates
from starlette.staticfiles import StaticFiles

from workspace.hello import printf_hello_world, greet

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
DB_PATH = os.path.join(BASE_DIR, "weather.db")

templates = Jinja2Templates(directory=TEMPLATES_DIR)


def init_db() -> None:
    """Initialize SQLite database with mock weather data if not present."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS weather (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            temperature REAL NOT NULL,
            condition TEXT NOT NULL,
            humidity REAL NOT NULL
        )
    """)
    cursor.execute("SELECT COUNT(*) FROM weather")
    if cursor.fetchone()[0] == 0:
        sample_data = [
            ("San Francisco", 65.5, "Partly Cloudy", 70.0),
            ("New York", 72.0, "Sunny", 55.0),
            ("London", 54.0, "Rainy", 85.0),
            ("Tokyo", 78.5, "Clear", 60.0),
        ]
        cursor.executemany(
            "INSERT INTO weather (city, temperature, condition, humidity) VALUES (?, ?, ?, ?)",
            sample_data,
        )
        conn.commit()
    conn.close()


init_db()


async def homepage(request: Request) -> Any:
    """Render the main dashboard homepage."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM weather")
    rows = cursor.fetchall()
    weather_list = [dict(row) for row in rows]
    conn.close()

    # Fixed: Do not pass unhashable/complex objects (like dicts containing contexts or heavy structures) 
    # directly into jinja template context in a way that triggers LRUCache unhashable errors if cached, 
    # or ensure simple primitive context dictionary.
    context = {
        "request": request,
        "weather_data": weather_list,
        "greeting": printf_hello_world(),
    }
    return templates.TemplateResponse("index.html", context)


async def api_hello(request: Request) -> JSONResponse:
    """API endpoint returning the printf hello world string."""
    return JSONResponse({"message": printf_hello_world(), "status": "success"})


async def api_weather(request: Request) -> JSONResponse:
    """API endpoint returning weather list."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM weather")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return JSONResponse(rows)


async def api_test(request: Request) -> JSONResponse:
    """Run pytest programmatically on target test suites."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    test_target = body.get("test_target", "tests/")
    # Run pytest securely
    result = subprocess.run(
        [sys.executable, "-m", "pytest", test_target],
        capture_output=True,
        text=True,
        cwd=os.path.dirname(BASE_DIR)
    )
    success = (result.returncode == 0)
    return JSONResponse({
        "success": success,
        "output": result.stdout + "\n" + result.stderr,
        "returncode": result.returncode
    })


routes = [
    Route("/", homepage, methods=["GET"]),
    Route("/api/hello", api_hello, methods=["GET"]),
    Route("/api/weather", api_weather, methods=["GET"]),
    Route("/api/test", api_test, methods=["POST"]),
]

app = Starlette(debug=True, routes=routes)