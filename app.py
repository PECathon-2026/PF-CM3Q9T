"""app.py - Streamlit Web Dashboard for PS-001 Autonomous AI Software Development Team.

Connects the full PS-001 agent workflow to a modern, interactive web dashboard:
- Planner Agent: Step-by-step checklist
- Developer Agent: Code proposal & diff viewer
- Reviewer Agent: Security audit & quality checklist
- Tester Agent: Sandboxed real-time pytest runner
- Orchestrator: Human-in-the-loop approval gates & auto-repair loop
"""

import difflib
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import streamlit as st
from dotenv import load_dotenv

# Ensure local imports find agents and tools
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Load environment variables from .env in project directory
load_dotenv(dotenv_path=BASE_DIR / ".env")

import agents
import tools

# ==============================================================================
# Page Configuration & Custom CSS
# ==============================================================================
st.set_page_config(
    page_title="PS-001 | Autonomous AI Dev Team",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 0.2rem;
        color: #1E88E5;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #555555;
        margin-bottom: 1.5rem;
    }
    .card-box {
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        padding: 18px;
        background-color: #ffffff;
        margin-bottom: 15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.03);
    }
    .status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .badge-info { background-color: #e3f2fd; color: #0d47a1; }
    .badge-success { background-color: #e8f5e9; color: #1b5e20; }
    .badge-warning { background-color: #fff3e0; color: #e65100; }
    .badge-danger { background-color: #ffebee; color: #b71c1c; }
    </style>
    """,
    unsafe_allow_html=True,
)


# ==============================================================================
# Helper Functions
# ==============================================================================
def check_api_configured() -> bool:
    """Check if GEMINI_API_KEY is present without exposing its value."""
    key = os.getenv("GEMINI_API_KEY")
    return bool(key and key != "your_gemini_api_key_here")


def compute_diff(original: str, modified: str, filename: str) -> str:
    """Generate a clean unified diff between original and modified code."""
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


def get_project_context_string() -> str:
    """Safely compile project files for agent context."""
    files = tools.list_files("workspace") + tools.list_files("tests")
    context_lines = []
    for f in files:
        try:
            content = tools.read_file_content(f)
            context_lines.append(f"--- File: {f} ---\n{content}\n")
        except Exception as e:
            context_lines.append(f"--- File: {f} (error reading: {e}) ---\n")
    return "\n".join(context_lines)


def reset_workflow():
    """Reset the current interactive workflow session."""
    st.session_state.step = "IDLE"
    st.session_state.plan = ""
    st.session_state.target_file = "workspace/hello.py"
    st.session_state.test_file = "tests/test_hello.py"
    st.session_state.original_code = ""
    st.session_state.proposed_code = ""
    st.session_state.explanation = ""
    st.session_state.review_report = ""
    st.session_state.test_results = None
    st.session_state.attempt = 1
    st.session_state.error_feedback = None
    st.session_state.error_message = None


# ==============================================================================
# Session State Initialization
# ==============================================================================
if "step" not in st.session_state:
    reset_workflow()
if "user_request" not in st.session_state:
    st.session_state.user_request = ""


# ==============================================================================
# Sidebar: System Status & Workspace Explorer
# ==============================================================================
with st.sidebar:
    st.image(
        "https://api.iconify.design/lucide:bot.svg?color=%231E88E5",
        width=50,
    )
    st.title("PS-001 System")
    st.caption("Autonomous AI Engineering Team")

    st.markdown("---")
    st.subheader("System Status")

    # API Status Indicator
    api_ready = check_api_configured()
    if api_ready:
        st.success("Gemini API: Connected (server .env)")
    else:
        st.error("Gemini API: Key Missing in .env")

    st.info(f"Model: `{agents.DEFAULT_MODEL}`")
    st.success("Sandbox: Restricted to `workspace/`")
    st.info("Pytest Timeout: 15 seconds")

    st.markdown("---")
    st.subheader("Workspace Inspector")

    allowed_files = tools.list_files("workspace") + tools.list_files("tests")
    if allowed_files:
        selected_file = st.selectbox("Inspect File:", allowed_files)
        if selected_file:
            try:
                content = tools.read_file_content(selected_file)
                with st.expander(f"View `{selected_file}`", expanded=False):
                    st.code(content, language="python", line_numbers=True)
            except Exception as exc:
                st.warning(f"Could not read {selected_file}: {exc}")
    else:
        st.write("No files found.")

    st.markdown("---")
    st.subheader("Direct Actions")
    if st.button("🧪 Run Test Suite Now", use_container_width=True):
        with st.spinner("Executing pytest tests..."):
            direct_results = tools.run_pytest()
            if direct_results["success"]:
                st.sidebar.success(f"Tests Passed! (Exit 0)")
            else:
                st.sidebar.error(f"Tests Failed! (Exit {direct_results['exit_code']})")
            st.sidebar.caption(direct_results["summary"])

    if st.button("🔄 Reset Workflow", use_container_width=True):
        reset_workflow()
        st.rerun()


# ==============================================================================
# Main Dashboard
# ==============================================================================
st.markdown('<div class="main-header">🤖 PS-001 Autonomous Dev Team</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-header">Collaborative multi-agent software engineering dashboard with sandboxed execution and human approval gates.</div>',
    unsafe_allow_html=True,
)

if not api_ready:
    st.error(
        "⚠️ **Configuration Alert**: `GEMINI_API_KEY` is missing in your local `.env` file.\n\n"
        "Please open `.env` on the server and add your Gemini API key from [Google AI Studio](https://aistudio.google.com/):"
    )
    st.code("GEMINI_API_KEY=your_actual_api_key_here", language="env")
    st.stop()

# Display any active top-level error messages
if st.session_state.error_message:
    st.error(st.session_state.error_message)
    if st.button("Clear Error"):
        st.session_state.error_message = None
        st.rerun()

# ==============================================================================
# SECTION 1: Enter Coding Request
# ==============================================================================
st.subheader("1. Enter Coding Request")

col_input, col_presets = st.columns([3, 1])

with col_presets:
    st.markdown("**Quick Prompts:**")
    if st.button("✨ Title Case Greeting", use_container_width=True):
        st.session_state.user_request = (
            "Improve greet() in workspace/hello.py to capitalize names, strip whitespace, "
            "and return 'Hello, Stranger!' when name is empty or spaces only."
        )
        st.rerun()
    if st.button("✨ Add Punctuation Check", use_container_width=True):
        st.session_state.user_request = (
            "Update greet() in workspace/hello.py to ensure names ending in punctuation are formatted correctly."
        )
        st.rerun()

with col_input:
    request_text = st.text_area(
        "What feature or bug fix should the AI team work on?",
        value=st.session_state.user_request,
        height=100,
        placeholder="e.g. Update greet() in workspace/hello.py to strip whitespace and return 'Hello, Stranger!' when empty.",
    )
    st.session_state.user_request = request_text

    col_btn, col_status = st.columns([1, 3])
    with col_btn:
        start_btn = st.button("🚀 Run AI Team", type="primary", use_container_width=True)

    if start_btn:
        if not request_text.strip():
            st.warning("Please enter a coding request first.")
        else:
            reset_workflow()
            st.session_state.user_request = request_text
            with st.spinner("Planner Agent is analyzing workspace and formulating implementation checklist..."):
                try:
                    context = get_project_context_string()
                    plan = agents.run_planner_agent(request_text, context)
                    st.session_state.plan = plan
                    st.session_state.step = "PLANNED"
                    st.session_state.error_message = None
                    st.rerun()
                except agents.GeminiServiceUnavailableError as exc:
                    st.session_state.error_message = (
                        f"Service Unavailable (503): High demand on Gemini API after 3 retry attempts. "
                        f"Please wait a few moments and try again."
                    )
                    st.rerun()
                except Exception as exc:
                    st.session_state.error_message = f"Failed to generate plan: {str(exc)}"
                    st.rerun()


# ==============================================================================
# SECTION 2: Planner Agent Card & Approval Gate 1
# ==============================================================================
if st.session_state.step != "IDLE" and st.session_state.plan:
    st.markdown("---")
    st.subheader("2. Planner Agent Architecture & Checklist")

    with st.expander("📋 View Implementation Checklist", expanded=True):
        st.markdown(st.session_state.plan)

    if st.session_state.step == "PLANNED":
        st.info("👋 **Human-in-the-Loop Checkpoint**: Please review the plan above before the Developer Agent writes code.")
        col_app1, col_rej1 = st.columns([1, 4])
        with col_app1:
            if st.button("✅ Approve Plan & Propose Code", type="primary"):
                with st.spinner("Developer Agent is generating code & Reviewer Agent is auditing..."):
                    try:
                        target_file = st.session_state.target_file
                        test_file = st.session_state.test_file

                        # Read current code
                        try:
                            orig = tools.read_file_content(target_file)
                        except Exception:
                            orig = ""
                        st.session_state.original_code = orig

                        try:
                            test_code = tools.read_file_content(test_file)
                        except Exception:
                            test_code = ""

                        # Developer Agent generates code
                        explanation, proposed = agents.run_developer_agent(
                            plan=st.session_state.plan,
                            target_file=target_file,
                            current_content=orig,
                            test_suite_code=test_code,
                            error_feedback=st.session_state.error_feedback,
                        )

                        if not proposed.strip():
                            st.session_state.error_message = "Developer Agent did not return valid code."
                            st.rerun()

                        st.session_state.explanation = explanation
                        st.session_state.proposed_code = proposed

                        # Reviewer Agent audits code
                        audit_report = agents.run_reviewer_agent(
                            target_file=target_file,
                            proposed_code=proposed,
                            plan=st.session_state.plan,
                        )
                        st.session_state.review_report = audit_report
                        st.session_state.step = "DEVELOPED"
                        st.session_state.error_message = None
                        st.rerun()

                    except agents.GeminiServiceUnavailableError as exc:
                        st.session_state.error_message = (
                            f"Service Unavailable (503): High demand on Gemini API after retries. "
                            f"Please try again shortly."
                        )
                        st.rerun()
                    except Exception as exc:
                        st.session_state.error_message = f"Development phase failed: {str(exc)}"
                        st.rerun()

        with col_rej1:
            if st.button("❌ Cancel Workflow"):
                reset_workflow()
                st.rerun()


# ==============================================================================
# SECTION 3: Code Proposal, Diff & Security Audit (Approval Gate 2)
# ==============================================================================
if st.session_state.step in ["DEVELOPED", "APPLIED", "TESTED"]:
    st.markdown("---")
    st.subheader(f"3. Code Proposal & Security Audit (Attempt {st.session_state.attempt}/3)")

    col_code, col_review = st.columns([1, 1])

    with col_code:
        st.markdown(f"**Proposed Changes for `{st.session_state.target_file}`:**")
        tab_code, tab_diff = st.tabs(["📄 Full Proposed Code", "🔍 Visual Diff"])
        with tab_code:
            st.code(st.session_state.proposed_code, language="python", line_numbers=True)
        with tab_diff:
            diff_text = compute_diff(
                st.session_state.original_code,
                st.session_state.proposed_code,
                st.session_state.target_file,
            )
            st.code(diff_text, language="diff")

    with col_review:
        st.markdown("**🛡️ Reviewer Agent Audit Report:**")
        with st.expander("Security & Quality Audit", expanded=True):
            st.markdown(st.session_state.review_report)

    # Human-in-the-Loop Gate 2: Applying Code
    if st.session_state.step == "DEVELOPED":
        st.warning(
            "🔒 **Human-in-the-Loop Checkpoint**: File modifications are restricted to `workspace/`. "
            "Do you approve applying these proposed changes to disk?"
        )
        col_app2, col_rej2 = st.columns([1, 4])
        with col_app2:
            if st.button("✅ Approve & Apply to workspace/", type="primary"):
                try:
                    # Write strictly to workspace/
                    written = tools.write_workspace_file(
                        st.session_state.target_file,
                        st.session_state.proposed_code,
                    )
                    st.success(f"Saved changes to `{written}`")
                    st.session_state.step = "APPLIED"
                    st.rerun()
                except Exception as exc:
                    st.error(f"Security error saving file: {exc}")

        with col_rej2:
            if st.button("❌ Reject Code Changes"):
                st.info("Proposed changes were rejected.")
                st.session_state.step = "PLANNED"
                st.rerun()


# ==============================================================================
# SECTION 4: Test Suite & Auto-Repair Loop
# ==============================================================================
if st.session_state.step in ["APPLIED", "TESTED"]:
    st.markdown("---")
    st.subheader("4. Automated Pytest Verification")

    if st.session_state.step == "APPLIED":
        st.info("Code is saved in `workspace/`. Ready to run the automated pytest test suite.")
        if st.button("🧪 Run Automated Pytest Suite", type="primary"):
            with st.spinner("Tester Agent is executing pytest tests with 15s timeout..."):
                test_result = agents.run_tester_agent(timeout_seconds=15)
                st.session_state.test_results = test_result
                st.session_state.step = "TESTED"
                st.rerun()

    if st.session_state.step == "TESTED" and st.session_state.test_results:
        results = st.session_state.test_results
        success = results["success"]

        if success:
            st.success("🎉 **SUCCESS! All automated tests passed!**")
            st.balloons()
            st.markdown(f"**Test Summary:** {results['summary']}")
            with st.expander("View Full Pytest Console Output", expanded=False):
                st.code(results["stdout"], language="text")

            st.markdown("### Summary of Changed Files:")
            st.info(f"📁 Modified: `{st.session_state.target_file}` (Verified with 0 test failures)")

        else:
            st.error(f"❌ **Tests Failed** (Exit Code {results['exit_code']}): {results['summary']}")
            with st.expander("View Test Failure Logs", expanded=True):
                st.code(results["stdout"] + "\n" + results["stderr"], language="text")

            if st.session_state.attempt < 3:
                st.warning(
                    f"🔄 **Auto-Repair Loop Available** (Attempt {st.session_state.attempt}/3). "
                    "The Tester Agent can forward the error logs back to the Developer Agent for an automated repair attempt."
                )
                if st.button(f"🔄 Trigger Auto-Repair (Attempt {st.session_state.attempt + 1}/3)", type="primary"):
                    st.session_state.attempt += 1
                    st.session_state.error_feedback = (
                        f"STDOUT:\n{results['stdout']}\nSTDERR:\n{results['stderr']}\nExit code: {results['exit_code']}"
                    )
                    with st.spinner(f"Developer Agent is repairing code based on test failure (Attempt {st.session_state.attempt}/3)..."):
                        try:
                            # Re-run developer agent with failure feedback
                            explanation, repaired_code = agents.run_developer_agent(
                                plan=st.session_state.plan,
                                target_file=st.session_state.target_file,
                                current_content=st.session_state.proposed_code,
                                test_suite_code=tools.read_file_content(st.session_state.test_file),
                                error_feedback=st.session_state.error_feedback,
                            )
                            st.session_state.explanation = explanation
                            st.session_state.proposed_code = repaired_code

                            # Re-run reviewer agent
                            audit_report = agents.run_reviewer_agent(
                                target_file=st.session_state.target_file,
                                proposed_code=repaired_code,
                                plan=st.session_state.plan,
                            )
                            st.session_state.review_report = audit_report
                            st.session_state.step = "DEVELOPED"
                            st.rerun()
                        except Exception as exc:
                            st.session_state.error_message = f"Repair attempt failed: {exc}"
                            st.rerun()
            else:
                st.error("⚠️ **Maximum Repair Attempts (3/3) Reached.** Manual human review is required.")

