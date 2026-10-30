"""server.py - ASGI Backend Server for PS-001 Autonomous AI Coding Platform.

Exposes REST APIs connecting the modern web UI to:
- Planner, Developer, Reviewer, and Tester agents (agents.py)
- Sandboxed file tools and pytest runner (tools.py)
- Server-side environment secrets (.env)
"""

import difflib
import io
import json
import os
import sys
import zipfile
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv
from starlette.applications import Starlette
from starlette.concurrency import run_in_threadpool
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Load .env file from project root
load_dotenv(dotenv_path=BASE_DIR / ".env")

import agents
import tools

STATIC_DIR = BASE_DIR / "static"


def compute_diff(original: str, modified: str, filename: str) -> str:
    """Compute unified diff between original and modified code."""
    orig_lines = original.splitlines(keepends=True)
    mod_lines = modified.splitlines(keepends=True)
    diff = list(
        difflib.unified_diff(
            orig_lines,
            mod_lines,
            fromfile=f"a/{filename} (current)",
            tofile=f"b/{filename} (proposed)",
            lineterm="",
        )
    )
    return "".join(diff) if diff else "# No textual differences detected"


def get_project_context() -> str:
    """Collect file summaries from workspace/ and tests/."""
    files = tools.list_files("workspace") + tools.list_files("tests")
    context_lines = []
    for f in files:
        try:
            content = tools.read_file_content(f)
            context_lines.append(f"--- File: {f} ---\n{content}\n")
        except Exception as e:
            context_lines.append(f"--- File: {f} (error reading: {e}) ---\n")
    return "\n".join(context_lines)


# ==============================================================================
# API Endpoints
# ==============================================================================
async def api_status(request: Request) -> JSONResponse:
    """Return backend health, model, and readiness without exposing keys."""
    key = os.getenv("GEMINI_API_KEY", "")
    has_key = bool(key and key != "your_gemini_api_key_here")
    files = tools.list_files("workspace") + tools.list_files("tests")

    return JSONResponse(
        {
            "status": "ready" if has_key else "needs_configuration",
            "has_api_key": has_key,
            "model": agents.DEFAULT_MODEL,
            "sandbox": "Restricted strictly to workspace/",
            "test_timeout_seconds": 15,
            "files": files,
        }
    )


async def api_list_files(request: Request) -> JSONResponse:
    """List allowed files in workspace/ and tests/."""
    workspace_files = tools.list_files("workspace")
    test_files = tools.list_files("tests")
    return JSONResponse({"workspace": workspace_files, "tests": test_files, "all": workspace_files + test_files})


async def api_get_file(request: Request) -> JSONResponse:
    """Safely read a file's content within workspace/ or tests/."""
    path = request.query_params.get("path", "")
    if not path:
        return JSONResponse({"error": "Path parameter is required"}, status_code=400)
    try:
        content = tools.read_file_content(path)
        return JSONResponse({"path": path, "content": content})
    except ValueError as exc:
        return JSONResponse({"error": str(exc)}, status_code=403)
    except FileNotFoundError:
        return JSONResponse({"error": f"File '{path}' not found"}, status_code=404)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


async def api_plan(request: Request) -> JSONResponse:
    """Planner Agent endpoint: converts prompt into structured checklist."""
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON body"}, status_code=400)

    user_request = data.get("request", "").strip()
    if not user_request:
        return JSONResponse({"error": "Request prompt is required"}, status_code=400)

    try:
        context = await run_in_threadpool(get_project_context)
        plan = await run_in_threadpool(agents.run_planner_agent, user_request, context)
        return JSONResponse({"plan": plan, "user_request": user_request})
    except agents.GeminiServiceUnavailableError as exc:
        return JSONResponse(
            {
                "error": "Gemini API is temporarily busy (503/429). Please try again in a few moments.",
                "type": "503_UNAVAILABLE",
            },
            status_code=503,
        )
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


async def api_develop(request: Request) -> JSONResponse:
    """Developer & Reviewer Agent endpoint: proposes code changes and audits security."""
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON body"}, status_code=400)

    plan = data.get("plan", "")
    target_file = data.get("target_file", "workspace/hello.py")
    test_file = data.get("test_file", "tests/test_hello.py")
    error_feedback = data.get("error_feedback", None)

    try:
        try:
            current_code = tools.read_file_content(target_file)
        except Exception:
            current_code = ""

        try:
            test_code = tools.read_file_content(test_file)
        except Exception:
            test_code = ""

        # Developer Agent proposes code, templates, and tests
        explanation, proposed_code, proposed_tests, files_dict = await run_in_threadpool(
            agents.run_developer_agent,
            plan=plan,
            target_file=target_file,
            current_content=current_code,
            test_suite_code=test_code,
            error_feedback=error_feedback,
            return_test_code=True,
            return_files=True,
        )

        if not proposed_code.strip() and not files_dict:
            return JSONResponse(
                {"error": "Developer Agent failed to produce valid code.", "raw_response": explanation},
                status_code=500,
            )

        # Reviewer Agent audits code
        review_report = await run_in_threadpool(
            agents.run_reviewer_agent,
            target_file=target_file,
            proposed_code=proposed_code,
            plan=plan,
            additional_files=files_dict,
        )

        # Compute diff for primary file and all generated files
        diff_text = compute_diff(current_code, proposed_code, target_file)
        file_diffs = {}
        for fpath, fcontent in files_dict.items():
            existing_content = ""
            try:
                existing_content = tools.read_file_content(fpath)
            except Exception:
                existing_content = ""
            file_diffs[fpath] = compute_diff(existing_content, fcontent, fpath)

        return JSONResponse(
            {
                "target_file": target_file,
                "original_code": current_code,
                "proposed_code": proposed_code,
                "proposed_tests": proposed_tests,
                "files": files_dict,
                "file_diffs": file_diffs,
                "explanation": explanation,
                "review_report": review_report,
                "diff": diff_text,
            }
        )
    except agents.GeminiServiceUnavailableError as exc:
        return JSONResponse(
            {"error": "Gemini API unavailable. Please retry shortly.", "type": "503_UNAVAILABLE"},
            status_code=503,
        )
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


async def api_apply(request: Request) -> JSONResponse:
    """Human approval gate: applies approved code and multi-file packages to workspace/ and tests/."""
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON body"}, status_code=400)

    files = data.get("files", {})
    target_file = data.get("target_file", "")
    content = data.get("content", "")
    test_file = data.get("test_file", "tests/test_hello.py")
    test_content = data.get("test_content", "")

    written_paths = []
    try:
        # If multi-file dictionary provided
        if files and isinstance(files, dict):
            for rel_path, file_content in files.items():
                clean_path = rel_path.replace("\\", "/").strip()
                if clean_path.startswith("workspace/"):
                    p = tools.write_workspace_file(clean_path, file_content)
                    written_paths.append(str(p))
                elif clean_path.startswith("tests/"):
                    p = tools.write_test_file(clean_path, file_content)
                    written_paths.append(str(p))

        # Always ensure target_file and test_content are applied if explicitly provided
        if target_file and content and not any(target_file in p for p in written_paths):
            p = tools.write_workspace_file(target_file, content)
            written_paths.append(str(p))

        if test_content and test_content.strip() and not any(test_file in p for p in written_paths):
            p = tools.write_test_file(test_file, test_content)
            written_paths.append(str(p))

        all_files = tools.list_files("workspace") + tools.list_files("tests")

        return JSONResponse(
            {
                "success": True,
                "written_files": written_paths,
                "files": all_files,
                "message": f"Successfully committed {len(written_paths)} files to workspace.",
            }
        )
    except ValueError as exc:
        return JSONResponse({"error": str(exc)}, status_code=403)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


async def api_project_new(request: Request) -> JSONResponse:
    """Initialize a clean project workspace."""
    try:
        # Reset starter hello.py and tests
        tools.write_workspace_file(
            "hello.py",
            '"""Sample module for PS-001 autonomous software development team workspace."""\n\n\ndef greet(name: str) -> str:\n    """Return a greeting message for the given name."""\n    if not name or not name.strip():\n        return "Hello, Stranger!"\n    return f"Hello, {name.strip()}!"\n'
        )
        tools.write_test_file(
            "test_hello.py",
            '"""Pytest test suite for workspace.hello."""\nimport sys\nfrom pathlib import Path\n\nWORKSPACE_DIR = Path(__file__).resolve().parent.parent / "workspace"\nif str(WORKSPACE_DIR) not in sys.path:\n    sys.path.insert(0, str(WORKSPACE_DIR))\n\nfrom hello import greet\n\n\ndef test_greet_standard_name():\n    assert greet("Alice") == "Hello, Alice!"\n\n\ndef test_greet_with_whitespace():\n    assert greet("  Bob  ") == "Hello, Bob!"\n\n\ndef test_greet_empty_name():\n    assert greet("") == "Hello, Stranger!"\n\n\ndef test_greet_none_or_spaces():\n    assert greet("   ") == "Hello, Stranger!"\n'
        )
        all_files = tools.list_files("workspace") + tools.list_files("tests")
        return JSONResponse({"success": True, "files": all_files, "message": "Project workspace successfully initialized."})
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


async def api_test(request: Request) -> JSONResponse:
    """Tester Agent endpoint: executes real pytest tests with a 15-second timeout."""
    try:
        data = await request.json()
    except Exception:
        data = {}

    target = data.get("test_target", "tests")
    try:
        result = await run_in_threadpool(tools.run_pytest, test_target=target, timeout_seconds=15)
        return JSONResponse(result)
    except Exception as exc:
        return JSONResponse({"error": str(exc), "success": False, "exit_code": 1}, status_code=500)


async def api_debug(request: Request) -> JSONResponse:
    """Debugging Agent endpoint: analyzes failed pytest tests and suggests verified code fixes."""
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON body"}, status_code=400)

    test_name = data.get("test_name", "failed_test")
    error_details = data.get("error_details", "")
    target_file = data.get("target_file", "workspace/hello.py")
    test_file = data.get("test_file", "tests/test_hello.py")

    try:
        current_code = ""
        try:
            current_code = tools.read_file_content(target_file)
        except Exception:
            pass

        test_code = ""
        try:
            test_code = tools.read_file_content(test_file)
        except Exception:
            pass

        diagnosis, files_dict, root_cause = await run_in_threadpool(
            agents.run_debugger_agent,
            test_name=test_name,
            error_details=error_details,
            target_file=target_file,
            code_content=current_code,
            test_file=test_file,
            test_content=test_code,
        )

        return JSONResponse(
            {
                "success": True,
                "test_name": test_name,
                "root_cause": root_cause,
                "diagnosis": diagnosis,
                "files": files_dict,
            }
        )
    except agents.GeminiServiceUnavailableError:
        return JSONResponse(
            {"error": "Gemini API unavailable. Please retry shortly.", "type": "503_UNAVAILABLE"},
            status_code=503,
        )
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


async def api_download_zip(request: Request) -> Response:
    """Package workspace/ files and test files into a downloadable ZIP archive."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # Include all files in workspace/
        for item in tools.WORKSPACE_DIR.rglob("*"):
            if item.is_file() and not item.name.endswith(".pyc") and "__pycache__" not in str(item):
                rel_path = item.relative_to(tools.WORKSPACE_DIR)
                zip_file.write(item, arcname=f"workspace/{rel_path}")

        # Include test files from tests/ (excluding framework tests like test_server.py)
        for item in tools.TESTS_DIR.rglob("*"):
            if item.is_file() and not item.name.endswith(".pyc") and "__pycache__" not in str(item):
                if item.name != "test_server.py":
                    rel_path = item.relative_to(tools.TESTS_DIR)
                    zip_file.write(item, arcname=f"tests/{rel_path}")

    buffer.seek(0)
    zip_bytes = buffer.getvalue()

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": 'attachment; filename="ps001_project.zip"',
            "Content-Length": str(len(zip_bytes)),
        },
    )


# ==============================================================================
# Routes & Starlette Application
# ==============================================================================
api_routes = [
    Route("/api/status", api_status, methods=["GET"]),
    Route("/api/files", api_list_files, methods=["GET"]),
    Route("/api/file", api_get_file, methods=["GET"]),
    Route("/api/plan", api_plan, methods=["POST"]),
    Route("/api/develop", api_develop, methods=["POST"]),
    Route("/api/apply", api_apply, methods=["POST"]),
    Route("/api/test", api_test, methods=["POST"]),
    Route("/api/debug", api_debug, methods=["POST"]),
    Route("/api/project/new", api_project_new, methods=["POST"]),
    Route("/api/download/zip", api_download_zip, methods=["GET"]),
]

# Ensure static directory exists for serving frontend build
STATIC_DIR.mkdir(exist_ok=True)
index_file = STATIC_DIR / "index.html"
if not index_file.exists():
    index_file.write_text(
        "<!DOCTYPE html><html><head><title>PS-001</title></head><body><h1>PS-001 Backend Ready</h1><p>Building frontend assets...</p></body></html>",
        encoding="utf-8",
    )

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
]

app = Starlette(
    routes=api_routes + [Mount("/", StaticFiles(directory=str(STATIC_DIR), html=True))],
    middleware=middleware,
)

if __name__ == "__main__":
    import uvicorn

    print("======================================================================")
    print("   [PS-001] Autonomous AI Software Engineering Platform Server")
    print("======================================================================")
    print("  * Web Dashboard : http://127.0.0.1:8000")
    print("  * API Status    : http://127.0.0.1:8000/api/status")
    print("  * Model         : " + agents.DEFAULT_MODEL)
    print("  * Sandbox       : Restricted strictly to workspace/")
    print("======================================================================\n")
    uvicorn.run("server:app", host="127.0.0.1", port=8000, log_level="info")

