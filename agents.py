"""agents.py - Multi-Agent Definitions for PS-001 Autonomous Dev Team.

Agents implemented:
1. Planner Agent: Converts plain-English requests into a structured implementation checklist.
2. Developer Agent: Produces proposed code changes to satisfy the plan or fix test errors.
3. Reviewer Agent: Audits code changes for security vulnerabilities and code quality.
4. Tester Agent: Executes real pytest tests via tools.py and synthesizes diagnostic feedback.
"""

import os
import re
import time
from typing import Any, Dict, Optional, Tuple
from google import genai
from google.genai import errors, types

import tools

# Default Gemini model used across agents (with smart fallback if rate-limited)
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

FALLBACK_MODELS = [
    DEFAULT_MODEL,
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
]


class GeminiServiceUnavailableError(RuntimeError):
    """Raised when the Gemini API returns 503 UNAVAILABLE or 429 across all attempts."""
    pass


def generate_content_with_retry(
    client: genai.Client,
    model: str,
    contents: Any,
    config: Optional[types.GenerateContentConfig] = None,
    max_attempts: int = 3,
    initial_delay: float = 1.5,
    backoff_factor: float = 2.0,
) -> Any:
    """Execute client.models.generate_content with exponential backoff and quota fallback.

    Retries on transient 503 (high demand) errors.
    Automatically switches to a fast fallback model if 429 quota exhaustion is encountered.
    """
    candidate_models = [model] + [m for m in FALLBACK_MODELS if m != model]
    last_error: Optional[Exception] = None

    for current_model in candidate_models:
        delay = initial_delay
        for attempt in range(1, max_attempts + 1):
            try:
                return client.models.generate_content(
                    model=current_model,
                    contents=contents,
                    config=config,
                )
            except errors.ServerError as err:
                last_error = err
                is_503 = (
                    getattr(err, "code", None) == 503
                    or "503" in str(err)
                    or "UNAVAILABLE" in str(err)
                )
                if is_503 and attempt < max_attempts:
                    print(
                        f"\n[!] Model {current_model} temporarily busy (503). "
                        f"Retrying in {delay:.1f}s ({attempt}/{max_attempts})..."
                    )
                    time.sleep(delay)
                    delay *= backoff_factor
                    continue
                break  # try next candidate model if available
            except errors.ClientError as err:
                last_error = err
                is_429 = getattr(err, "code", None) == 429 or "429" in str(err) or "RESOURCE_EXHAUSTED" in str(err)
                is_404 = getattr(err, "code", None) == 404 or "404" in str(err) or "NOT_FOUND" in str(err)
                if (is_429 or is_404) and current_model != candidate_models[-1]:
                    print(f"\n[!] Model {current_model} reached limit or unavailable ({type(err).__name__}). Switching to fallback model...")
                    break
                raise
            except Exception as err:
                last_error = err
                raise

    if last_error:
        raise GeminiServiceUnavailableError(
            f"Gemini API unavailable across models: {str(last_error)}"
        ) from last_error


def get_genai_client() -> genai.Client:
    """Initialize and return the official Google Gen AI SDK client.

    Reads GEMINI_API_KEY from environment variables automatically.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable is missing. "
            "Please create a .env file and set GEMINI_API_KEY=your_key."
        )
    return genai.Client(api_key=api_key)


# ==========================================
# 1. PLANNER AGENT
# ==========================================
PLANNER_SYSTEM_INSTRUCTION = """You are the Lead Software Architect & Planner for the PS-001 autonomous engineering team.
Your responsibility is to turn a plain-English user feature, bugfix, or full project request into a precise, step-by-step implementation checklist.

Guidelines:
1. Examine the user request and project context.
2. For full application or website requests (e.g. "Create a student management website using Python and HTML"):
   - Architect the backend (e.g. workspace/app.py or workspace/hello.py with Flask, Starlette, or Python standard library http.server/sqlite3).
   - Architect the frontend (e.g. workspace/templates/index.html with modern, responsive HTML/CSS, tables, forms, and statistics).
   - Architect the test suite (comprehensive pytest unit tests in tests/test_hello.py or tests/test_app.py testing CRUD operations, edge cases, and HTML rendering).
3. Produce a clear, numbered checklist of engineering tasks specifying which files should be created or updated in workspace/ and tests/.
4. Keep changes focused directly on what the user requested.
5. Identify edge cases that tests should cover.
6. Do not write full code yourself; outline the exact logic and plan for the Developer Agent.
"""


def run_planner_agent(
    user_request: str,
    project_context: str,
    model: str = DEFAULT_MODEL,
) -> str:
    """Generate a step-by-step implementation plan from the user's prompt."""
    client = get_genai_client()

    prompt = f"""USER REQUEST:
{user_request}

PROJECT CONTEXT & CURRENT FILES:
{project_context}

Please generate an actionable, numbered implementation checklist for the team.
"""

    response = generate_content_with_retry(
        client=client,
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=PLANNER_SYSTEM_INSTRUCTION,
            temperature=0.2,
        ),
    )
    return response.text or "Error: Planner returned empty response."


# ==========================================
# 2. DEVELOPER AGENT
# ==========================================
DEVELOPER_SYSTEM_INSTRUCTION = """You are the Senior Full-Stack Python & Web Developer for the PS-001 autonomous engineering team.
Your task is to propose clean, robust, and PEP 8 compliant Python code, HTML templates, and pytest test suites to fulfill the implementation plan or repair failing tests.

CRITICAL RULES:
1. Provide complete, working, production-ready code for all required files. Never use placeholder comments or truncate code.
2. For websites or multi-file projects (e.g. "Create a student management website using Python and HTML"):
   - Backend logic / API: Provide the application in workspace/app.py (or workspace/hello.py). Use Flask, Starlette, or Python standard library (http.server/sqlite3). Include complete CRUD operations (add, get, list, search, delete) and clean routing.
   - Frontend interface: Provide a modern, responsive HTML page in workspace/templates/index.html (or workspace/index.html). Include clean CSS styling, tables, form modals, and statistics.
   - Automated tests: Provide comprehensive pytest unit tests in tests/test_hello.py (or tests/test_app.py) that test all operations and HTML rendering.
3. If the user request is introducing a new function, problem, or full project that replaces the starter template greet() function, DO NOT retain greet()! Replace it completely with the clean, standalone implementation strictly focused on the user's requirements.
4. Enclose EVERY file using this exact marker format:
--- BEGIN FILE: workspace/<filename> ---
<complete file content>
--- END FILE ---

--- BEGIN FILE: workspace/templates/<filename>.html ---
<complete file content>
--- END FILE ---

--- BEGIN FILE: tests/<test_filename>.py ---
<complete pytest test suite>
--- END FILE ---

5. Explain briefly the architecture of the proposed solution and what changes were made.
"""


def run_developer_agent(
    plan: str,
    target_file: str,
    current_content: str,
    test_suite_code: str,
    error_feedback: Optional[str] = None,
    model: str = DEFAULT_MODEL,
    return_test_code: bool = False,
    return_files: bool = False,
) -> Any:
    """Propose code changes for the target file, templates, and matching unit tests.

    Returns:
        - Tuple of (explanation, proposed_code) if return_test_code=False and return_files=False.
        - Tuple of (explanation, proposed_code, proposed_tests) if return_test_code=True and return_files=False.
        - Tuple of (explanation, proposed_code, proposed_tests, files_dict) if return_files=True.
    """
    client = get_genai_client()

    feedback_section = ""
    if error_feedback:
        feedback_section = f"""
PREVIOUS TEST FAILURE FEEDBACK (ATTEMPT REPAIR):
The previous code failed tests with the following error:
{error_feedback}
Please carefully analyze the error and fix the logic so all tests pass.
"""

    prompt = f"""IMPLEMENTATION PLAN:
{plan}

TARGET FILE:
{target_file}

CURRENT CONTENT OF {target_file}:
```python
{current_content}
```
{feedback_section}

Please provide the complete implementation for all required files using the required format:
--- BEGIN FILE: <filepath> ---
<complete updated code or template>
--- END FILE ---
"""

    response = generate_content_with_retry(
        client=client,
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=DEVELOPER_SYSTEM_INSTRUCTION,
            temperature=0.2,
        ),
    )

    full_text = response.text or ""

    # Parse out all file blocks
    files_dict: Dict[str, str] = {}
    pattern_all = r"--- BEGIN FILE:\s*([^\n\r]+?)\s*---\r?\n(.*?)--- END FILE ---"
    for match in re.finditer(pattern_all, full_text, re.DOTALL):
        fname = match.group(1).strip().replace("\\", "/")
        body = match.group(2).strip()
        if body.startswith("```"):
            lines = body.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            body = "\n".join(lines).strip()
        files_dict[fname] = body

    # Determine extracted_code
    extracted_code = ""
    if target_file in files_dict:
        extracted_code = files_dict[target_file]
    elif any(f.startswith("workspace/") for f in files_dict):
        # Prefer python files in workspace
        ws_py = [f for f in files_dict if f.startswith("workspace/") and f.endswith(".py")]
        ws_all = [f for f in files_dict if f.startswith("workspace/")]
        chosen_file = ws_py[0] if ws_py else ws_all[0]
        extracted_code = files_dict[chosen_file]
    else:
        # Fallback to regex or fence
        pattern_code = rf"--- BEGIN FILE:\s*{re.escape(target_file)}\s*---(.*?)--- END FILE ---"
        match_code = re.search(pattern_code, full_text, re.DOTALL)
        if match_code:
            extracted_code = match_code.group(1).strip()
        else:
            fence_match = re.search(r"```python\s*(.*?)\s*```", full_text, re.DOTALL)
            if fence_match:
                extracted_code = fence_match.group(1).strip()

    # Determine extracted_tests
    extracted_tests = ""
    for f, content in files_dict.items():
        if f.startswith("tests/"):
            extracted_tests = content
            break

    if not extracted_tests:
        pattern_tests = r"--- BEGIN FILE:\s*tests/[^\s-]+\.py\s*---(.*?)--- END FILE ---"
        match_tests = re.search(pattern_tests, full_text, re.DOTALL)
        if match_tests:
            extracted_tests = match_tests.group(1).strip()

    # Ensure files_dict at least has extracted_code
    if extracted_code and target_file not in files_dict:
        files_dict[target_file] = extracted_code
    if extracted_tests and not any(f.startswith("tests/") for f in files_dict):
        files_dict["tests/test_hello.py"] = extracted_tests

    if return_files:
        return full_text, extracted_code, extracted_tests, files_dict

    if return_test_code:
        return full_text, extracted_code, extracted_tests

    return full_text, extracted_code


# ==========================================
# 3. REVIEWER AGENT
# ==========================================
REVIEWER_SYSTEM_INSTRUCTION = """You are the Senior Security Auditor & Code Quality Reviewer for PS-001.
Review the proposed Python code change for:
1. Security: Are there any path traversals, shell injections, dangerous subprocess/os calls, or leaked credentials?
2. Quality: Does it conform to PEP 8, include type annotations, and handle potential edge cases?
3. Goal alignment: Does it fulfill the checklist items?

OUTPUT FORMAT:
Start your response with either:
DECISION: APPROVED
or
DECISION: CHANGES_REQUESTED

Followed by:
- Summary of review
- Security checklist (Pass/Fail)
- Specific suggestions or warnings (if any)
"""


def run_reviewer_agent(
    target_file: str,
    proposed_code: str,
    plan: str,
    model: str = DEFAULT_MODEL,
    additional_files: Optional[Dict[str, str]] = None,
) -> str:
    """Review proposed code for security and quality standards."""
    client = get_genai_client()

    extra_section = ""
    if additional_files:
        extra_parts = []
        for fpath, fcontent in additional_files.items():
            if fpath != target_file:
                extra_parts.append(f"--- FILE: {fpath} ---\n{fcontent}\n--- END ---")
        if extra_parts:
            extra_section = "\nADDITIONAL GENERATED PROJECT FILES:\n" + "\n\n".join(extra_parts)

    prompt = f"""TARGET FILE: {target_file}

PROPOSED CODE:
```python
{proposed_code}
```
{extra_section}

IMPLEMENTATION PLAN:
{plan}

Please review this code according to the security and quality guidelines.
"""

    response = generate_content_with_retry(
        client=client,
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=REVIEWER_SYSTEM_INSTRUCTION,
            temperature=0.1,
        ),
    )

    return response.text or "Error: Reviewer returned empty response."


# ==========================================
# 4. TESTER AGENT
# ==========================================
def run_tester_agent(
    timeout_seconds: int = 15,
    python_executable: Optional[str] = None,
    test_target: str = "tests",
) -> Dict[str, Any]:
    """Execute real pytest tests and return verified results.

    NEVER simulates or claims tests passed without running them.
    """
    results = tools.run_pytest(
        test_target=test_target,
        timeout_seconds=timeout_seconds,
        python_executable=python_executable,
    )
    return results


# ==========================================
# 5. DEBUGGER AGENT
# ==========================================
DEBUGGER_SYSTEM_INSTRUCTION = """You are the Senior Debugging Engineer for the PS-001 Autonomous Dev Team.
Your job is to perform an in-depth diagnosis of failing pytest test cases, identify the Root Cause, and generate a verified code fix.

RULES:
1. Conduct a rigorous Root Cause Analysis (RCA):
   - Explain why the test failed (e.g. wrong assertion expectation, boundary condition, None/empty check, wrong return type, syntax issue).
2. Clearly identify the affected workspace file or test file.
3. Provide the complete corrected code file(s) wrapped in standard block format:
--- BEGIN FILE: <path> ---
<complete corrected code>
--- END FILE ---
Example paths: workspace/hello.py, workspace/student_app.py, or tests/test_hello.py.
4. Output your response with clear markdown headings:
### Root Cause Analysis
[Concise explanation of the exact failure]

### Impact & Solution
[What changes are required]

### Corrected Code
--- BEGIN FILE: workspace/<filename> ---
<code>
--- END FILE ---

### Verification Note
[Why this fix guarantees the test will pass]
"""


def run_debugger_agent(
    test_name: str,
    error_details: str,
    target_file: str = "workspace/hello.py",
    code_content: str = "",
    test_file: str = "tests/test_hello.py",
    test_content: str = "",
    model: str = DEFAULT_MODEL,
) -> Tuple[str, Dict[str, str], str]:
    """Analyze a failed test with Gemini and generate an automated diagnosis and code fix.

    Returns:
        - diagnosis (str): Full markdown diagnostic report
        - files (Dict[str, str]): Dictionary of files proposed to fix the failure
        - root_cause (str): Short summary of the root cause
    """
    client = get_genai_client()

    prompt = f"""FAILING TEST CASE:
Test Name: {test_name}
Test File: {test_file}

PYTEST ERROR / TRACEBACK:
```text
{error_details}
```

CURRENT WORKSPACE CODE ({target_file}):
```python
{code_content}
```

CURRENT TEST CODE ({test_file}):
```python
{test_content}
```

Please perform a thorough Root Cause Analysis and provide the exact code fix in --- BEGIN FILE: <path> --- format.
"""

    response = generate_content_with_retry(
        client=client,
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=DEBUGGER_SYSTEM_INSTRUCTION,
            temperature=0.1,
        ),
    )

    full_text = response.text or "Error: Debugger returned empty response."

    # Parse files
    files_dict: Dict[str, str] = {}
    pattern_all = r"--- BEGIN FILE:\s*([^\n\r]+?)\s*---\r?\n(.*?)--- END FILE ---"
    for match in re.finditer(pattern_all, full_text, re.DOTALL):
        fname = match.group(1).strip().replace("\\", "/")
        body = match.group(2).strip()
        if body.startswith("```"):
            lines = body.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            body = "\n".join(lines).strip()
        files_dict[fname] = body

    # Extract short root cause summary from markdown
    rc_match = re.search(r"### Root Cause Analysis\s*\n(.*?)(?=\n###|\Z)", full_text, re.DOTALL)
    if rc_match:
        root_cause = rc_match.group(1).strip()
    else:
        root_cause = "Assertion or logic error identified in test execution."

    return full_text, files_dict, root_cause


