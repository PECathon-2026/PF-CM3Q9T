"""tools.py - Sandboxed file operations and test execution tools for PS-001.

This module provides safe, strictly jailed operations:
1. File modifications are restricted strictly to the 'workspace/' directory.
2. Path validation guards against path traversal attacks (e.g., '../../').
3. Pytest runner executes with a strict timeout and never runs arbitrary commands.
"""

import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Base directory for the PS-001 project
BASE_DIR: Path = Path(__file__).resolve().parent
WORKSPACE_DIR: Path = (BASE_DIR / "workspace").resolve()
TESTS_DIR: Path = (BASE_DIR / "tests").resolve()


def validate_workspace_path(rel_path: str) -> Path:
    """Validate that a target path is strictly within the workspace/ directory.

    Raises:
        ValueError: If the resolved path escapes the workspace/ folder.
    """
    clean_str = rel_path.replace("\\", "/").strip()
    if clean_str.startswith("workspace/"):
        clean_str = clean_str[len("workspace/"):]
    elif clean_str == "workspace":
        clean_str = ""

    clean_path = Path(clean_str)
    # If an absolute path was supplied, convert to relative to workspace if safe
    if clean_path.is_absolute():
        resolved = clean_path.resolve()
    else:
        resolved = (WORKSPACE_DIR / clean_path).resolve()

    # Ensure resolved path is strictly a descendant of WORKSPACE_DIR
    try:
        resolved.relative_to(WORKSPACE_DIR)
    except ValueError:
        raise ValueError(
            f"Security Violation: Path '{rel_path}' attempts to escape 'workspace/' directory!"
        )

    return resolved


def validate_read_path(rel_path: str) -> Path:
    """Validate that a target path is within either workspace/ or tests/ directory.

    Raises:
        ValueError: If the resolved path escapes allowed project areas.
    """
    clean_path = Path(rel_path)
    if clean_path.is_absolute():
        resolved = clean_path.resolve()
    else:
        resolved = (BASE_DIR / clean_path).resolve()

    in_workspace = False
    in_tests = False

    try:
        resolved.relative_to(WORKSPACE_DIR)
        in_workspace = True
    except ValueError:
        pass

    try:
        resolved.relative_to(TESTS_DIR)
        in_tests = True
    except ValueError:
        pass

    if not (in_workspace or in_tests):
        raise ValueError(
            f"Security Violation: Path '{rel_path}' is outside permitted read locations (workspace/ or tests/)."
        )

    return resolved


def read_file_content(rel_path: str) -> str:
    """Safely read the text content of a file in workspace/ or tests/."""
    safe_target = validate_read_path(rel_path)
    if not safe_target.exists():
        raise FileNotFoundError(f"File not found: {rel_path}")
    if not safe_target.is_file():
        raise IsADirectoryError(f"Target is a directory, not a file: {rel_path}")

    return safe_target.read_text(encoding="utf-8")


def write_workspace_file(rel_path: str, content: str) -> Path:
    """Safely write text content to a file inside the workspace/ directory."""
    safe_target = validate_workspace_path(rel_path)

    # Ensure parent directories exist
    safe_target.parent.mkdir(parents=True, exist_ok=True)

    # Write file content
    safe_target.write_text(content, encoding="utf-8")
    return safe_target


def write_test_file(rel_path: str, content: str) -> Path:
    """Safely write unit test code to a file inside the tests/ directory."""
    clean_str = rel_path.replace("\\", "/").strip()
    if clean_str.startswith("tests/"):
        clean_str = clean_str[len("tests/"):]
    elif clean_str == "tests":
        clean_str = ""

    clean_path = Path(clean_str)
    if clean_path.is_absolute():
        resolved = clean_path.resolve()
    else:
        resolved = (TESTS_DIR / clean_path).resolve()

    try:
        resolved.relative_to(TESTS_DIR)
    except ValueError:
        raise ValueError(
            f"Security Violation: Path '{rel_path}' attempts to escape 'tests/' directory!"
        )

    # Protect test_server.py framework tests from accidental modification
    if resolved.name == "test_server.py":
        raise ValueError("Security Violation: Modifying framework test_server.py is strictly forbidden!")

    resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(content, encoding="utf-8")
    return resolved


def list_files(subdirectory: str = "workspace") -> List[str]:
    """List all files in either 'workspace' or 'tests'."""
    if subdirectory == "workspace":
        target_dir = WORKSPACE_DIR
    elif subdirectory == "tests":
        target_dir = TESTS_DIR
    else:
        raise ValueError("Directory must be either 'workspace' or 'tests'.")

    if not target_dir.exists():
        return []

    relative_files = []
    for item in target_dir.rglob("*"):
        if item.is_file() and not item.name.endswith(".pyc") and "__pycache__" not in str(item):
            relative_files.append(str(item.relative_to(BASE_DIR)).replace("\\", "/"))

    return sorted(relative_files)


def parse_pytest_output(stdout: str, stderr: str = "", exit_code: int = 0) -> Dict[str, Any]:
    """Parse pytest verbose standard output to extract granular test cases and metrics.

    Identifies:
    - PASSED, FAILED, SKIPPED, ERROR outcomes
    - Line-by-line test function names and file targets
    - Detailed failure tracebacks and assertion differences
    - Collection failures and process errors
    """
    test_cases: List[Dict[str, Any]] = []

    # 1. Match individual verbose test case lines:
    # Example: tests/test_hello.py::test_greet_standard_name PASSED [ 8%]
    case_pattern = r"^([^\s:]+)::([^\s]+)\s+(PASSED|FAILED|SKIPPED|ERROR|XFAIL|XPASS)"
    matches = list(re.finditer(case_pattern, stdout, re.MULTILINE))

    # 2. Extract detailed failure blocks:
    # Example: ____________________ test_greet_empty_name ____________________
    failure_blocks: Dict[str, str] = {}
    fb_matches = re.findall(
        r"_{4,}\s+([^\s_]+)\s+_{4,}(.*?)(?=(?:_{4,}\s+[^\s_]+\s+_{4,})|(?:===+ short test summary)|(?:===+ [0-9]+ failed)|$)",
        stdout,
        re.DOTALL,
    )
    for name, block in fb_matches:
        failure_blocks[name.strip()] = block.strip()

    # 3. Extract short test summary lines:
    # Example: FAILED tests/test_hello.py::test_greet_empty_name - AssertionError: ...
    short_summaries: Dict[str, str] = {}
    short_matches = re.findall(
        r"^(?:FAILED|ERROR)\s+([^\s:]+)::([^\s]+)\s+-\s+(.+)$",
        stdout,
        re.MULTILINE,
    )
    for _fpath, tname, reason in short_matches:
        short_summaries[tname.strip()] = reason.strip()

    passed_count = 0
    failed_count = 0
    skipped_count = 0

    for m in matches:
        file_path = m.group(1).strip().replace("\\", "/")
        test_name = m.group(2).strip()
        outcome = m.group(3).strip()

        err_details = failure_blocks.get(test_name)
        short_err = short_summaries.get(test_name)
        if not err_details and outcome in ("FAILED", "ERROR"):
            err_details = short_err

        if outcome == "PASSED":
            passed_count += 1
        elif outcome in ("FAILED", "ERROR"):
            failed_count += 1
        elif outcome == "SKIPPED":
            skipped_count += 1

        test_cases.append(
            {
                "file": file_path,
                "name": test_name,
                "status": outcome,
                "error": err_details,
                "summary": short_err or (f"Passed successfully" if outcome == "PASSED" else f"Status: {outcome}"),
            }
        )

    # 4. Handle edge cases where pytest crashed or failed during collection
    if exit_code != 0 and len(test_cases) == 0:
        collection_err_match = re.search(r"ERROR collecting (.*)", stdout)
        error_msg = stderr.strip() if stderr.strip() else stdout.strip()
        if collection_err_match:
            coll_file = collection_err_match.group(1).strip().replace("\\", "/")
            test_cases.append(
                {
                    "file": coll_file,
                    "name": "collection_error",
                    "status": "ERROR",
                    "error": error_msg[:1200] if error_msg else "Pytest failed to collect test cases due to an error.",
                    "summary": f"Collection error in {coll_file}",
                }
            )
            failed_count = 1
        elif error_msg:
            test_cases.append(
                {
                    "file": "tests",
                    "name": "pytest_execution_error",
                    "status": "ERROR",
                    "error": error_msg[:1200],
                    "summary": "Process execution error occurred during test run.",
                }
            )
            failed_count = 1

    return {
        "total": len(test_cases),
        "passed_count": passed_count,
        "failed_count": failed_count,
        "skipped_count": skipped_count,
        "test_cases": test_cases,
    }


def run_pytest(
    test_target: str = "tests",
    timeout_seconds: int = 15,
    python_executable: Optional[str] = None,
) -> Dict[str, Any]:
    """Execute pytest on the specified test target with a strict timeout.

    This function never accepts or runs arbitrary shell commands. It only runs
    the fixed command: [python_executable, "-m", "pytest", test_target, "-v"].

    Returns a dictionary with:
        - success (bool): True strictly if exit_code == 0
        - exit_code (int): Actual process exit code
        - stdout (str): Standard output from pytest
        - stderr (str): Standard error from pytest
        - timed_out (bool): True if execution timed out
        - summary (str): A concise summary of the test run
        - total (int): Total test cases executed
        - passed_count (int): Number of passed tests
        - failed_count (int): Number of failed tests
        - skipped_count (int): Number of skipped / not run tests
        - test_cases (list): Structured list of individual test case results
        - test_target (str): The target that was executed
    """
    # Prefer virtual environment python if present
    venv_exe = BASE_DIR / ".venv" / "Scripts" / "python.exe"
    if python_executable:
        exe = python_executable
    elif venv_exe.exists():
        exe = str(venv_exe)
    else:
        exe = sys.executable

    # Ensure target only targets 'tests' or subfolders of 'tests'
    target_path = (BASE_DIR / test_target).resolve()
    try:
        target_path.relative_to(TESTS_DIR)
    except ValueError:
        if target_path != TESTS_DIR:
            return {
                "success": False,
                "exit_code": 1,
                "stdout": "",
                "stderr": f"Security Violation: Test target '{test_target}' is outside tests/.",
                "timed_out": False,
                "summary": "Invalid test target location.",
                "total": 0,
                "passed_count": 0,
                "failed_count": 1,
                "skipped_count": 0,
                "test_cases": [
                    {
                        "file": test_target,
                        "name": "security_jail_violation",
                        "status": "ERROR",
                        "error": f"Test target '{test_target}' is outside the tests/ directory.",
                        "summary": "Security Violation: outside tests/",
                    }
                ],
                "test_target": test_target,
            }

    # Fixed, non-shell command sequence prioritizing workspace/ in pythonpath
    command = [exe, "-m", "pytest", str(target_path), "-v", "-o", f"pythonpath={WORKSPACE_DIR}"]

    # Add workspace and base dir to PYTHONPATH so tests can import from workspace/
    env = os.environ.copy()
    existing_pythonpath = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = (
        str(WORKSPACE_DIR)
        + os.pathsep
        + str(BASE_DIR)
        + (os.pathsep + existing_pythonpath if existing_pythonpath else "")
    )

    try:
        result = subprocess.run(
            command,
            cwd=str(BASE_DIR),
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )

        success = result.returncode == 0
        parsed = parse_pytest_output(result.stdout, result.stderr, result.returncode)

        if success:
            summary = f"All {parsed['passed_count']} tests passed successfully!"
        else:
            summary = f"{parsed['failed_count']} tests failed (Exit Code {result.returncode})."

        return {
            "success": success,
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "timed_out": False,
            "summary": summary,
            "total": parsed["total"],
            "passed_count": parsed["passed_count"],
            "failed_count": parsed["failed_count"],
            "skipped_count": parsed["skipped_count"],
            "test_cases": parsed["test_cases"],
            "test_target": test_target,
        }

    except subprocess.TimeoutExpired as exc:
        out = exc.stdout or "" if isinstance(exc.stdout, str) else ""
        err = f"Execution timed out after {timeout_seconds} seconds."
        return {
            "success": False,
            "exit_code": -1,
            "stdout": out,
            "stderr": err,
            "timed_out": True,
            "summary": f"Pytest timed out after {timeout_seconds}s.",
            "total": 1,
            "passed_count": 0,
            "failed_count": 1,
            "skipped_count": 0,
            "test_cases": [
                {
                    "file": test_target,
                    "name": "pytest_timeout",
                    "status": "ERROR",
                    "error": err,
                    "summary": f"Pytest timed out after {timeout_seconds}s.",
                }
            ],
            "test_target": test_target,
        }
    except Exception as exc:
        err = f"Failed to execute pytest: {str(exc)}"
        return {
            "success": False,
            "exit_code": -1,
            "stdout": "",
            "stderr": err,
            "timed_out": False,
            "summary": "Process execution error.",
            "total": 1,
            "passed_count": 0,
            "failed_count": 1,
            "skipped_count": 0,
            "test_cases": [
                {
                    "file": test_target,
                    "name": "process_error",
                    "status": "ERROR",
                    "error": err,
                    "summary": "Failed to launch pytest process.",
                }
            ],
            "test_target": test_target,
        }

