"""main.py - Orchestrator for PS-001 Autonomous AI Software Development Team.

Coordinates:
- Planner Agent: Formulates structured plan from user request.
- Developer Agent: Proposes code modifications.
- Reviewer Agent: Audits code security and style.
- Tester Agent: Executes real pytest suite with timeouts.
- Feedback Loop: Feeds test failures back to Developer Agent for up to 3 repair attempts.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

import agents
import tools

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Load environment variables from .env file
load_dotenv()

MAX_REPAIR_ATTEMPTS = 3


def print_banner():
    print("=" * 70)
    print("   [PS-001] Autonomous AI Software Development Team")
    print("=" * 70)
    print("  * Planner Agent   : Turns request into a checklist")
    print("  * Developer Agent : Proposes code changes (sandboxed to workspace/)")
    print("  * Reviewer Agent  : Audits security & code quality")
    print("  * Tester Agent    : Runs verified pytest tests with timeout")
    print("  * Orchestrator    : Coordinates the team with human-in-the-loop gates")
    print("=" * 70 + "\n")


def check_api_key() -> bool:
    """Verify that GEMINI_API_KEY is configured."""
    key = os.getenv("GEMINI_API_KEY")
    if not key or key == "your_gemini_api_key_here":
        print("\n[!] Configuration Notice: GEMINI_API_KEY is missing or unconfigured!")
        print("Please follow these steps:")
        print("  1. Get a free API key from Google AI Studio: https://aistudio.google.com/")
        print("  2. Create or open the .env file in this directory:")
        print("     GEMINI_API_KEY=your_actual_api_key_here")
        print("  3. Run main.py again.\n")
        return False
    return True


def ask_user_approval(prompt_message: str, default_yes: bool = True) -> bool:
    """Prompt the user for explicit approval before critical actions."""
    suffix = " [Y/n]: " if default_yes else " [y/N]: "
    try:
        choice = input(prompt_message + suffix).strip().lower()
        if not choice:
            return default_yes
        return choice in ("y", "yes")
    except (KeyboardInterrupt, EOFError):
        print("\nAction cancelled by user.")
        return False


def get_project_context() -> str:
    """Gather file summaries from workspace/ and tests/ for agent context."""
    files = tools.list_files("workspace") + tools.list_files("tests")
    context_lines = []
    for file_path in files:
        try:
            content = tools.read_file_content(file_path)
            context_lines.append(f"--- File: {file_path} ---\n{content}\n")
        except Exception as e:
            context_lines.append(f"--- File: {file_path} (error reading: {e}) ---\n")
    return "\n".join(context_lines)


def run_orchestrator(custom_request: str = ""):
    """Run the complete multi-agent autonomous development workflow."""
    print_banner()

    if not check_api_key():
        return

    try:
        # 1. Gather Goal / Request
        if custom_request.strip():
            user_request = custom_request.strip()
        else:
            print("Enter your coding request for the AI team.")
            print("(Press Enter to use the default demo request: 'Improve greet() in workspace/hello.py to capitalize names and return \"Hello, Stranger!\" for empty inputs')\n")
            user_input = input("Your request: ").strip()
            user_request = user_input if user_input else (
                "Improve greet() in workspace/hello.py to capitalize names, strip extra spaces, "
                "and return 'Hello, Stranger!' when name is empty or only whitespace."
            )

        print(f"\n[REQUEST] User Request: {user_request}\n")

        # 2. Planning Phase
        print("[Phase 1: Planning] Planner Agent is analyzing requirements and project files...")
        project_context = get_project_context()
        plan = agents.run_planner_agent(user_request, project_context)

        print("\n" + "-" * 70)
        print("[PLAN] PLANNER AGENT CHECKLIST:")
        print("-" * 70)
        print(plan)
        print("-" * 70)

        if not ask_user_approval("Do you approve this plan to proceed with development?"):
            print("Plan rejected or halted by user. Exiting workflow.")
            return

        # 3. Development, Review, and Test Loop
        target_file = "workspace/hello.py"
        test_file = "tests/test_hello.py"

        test_suite_code = ""
        try:
            test_suite_code = tools.read_file_content(test_file)
        except Exception:
            test_suite_code = "# No test file content available"

        attempt = 1
        error_feedback = None

        while attempt <= MAX_REPAIR_ATTEMPTS:
            print(f"\n" + "=" * 70)
            print(f"[Phase 2: Development -- Attempt {attempt} of {MAX_REPAIR_ATTEMPTS}]")
            print("=" * 70)

            # Read current content of target file
            try:
                current_code = tools.read_file_content(target_file)
            except Exception:
                current_code = ""

            # Developer Agent proposes code
            print(f"Developer Agent is generating proposed code for {target_file}...")
            explanation, proposed_code = agents.run_developer_agent(
                plan=plan,
                target_file=target_file,
                current_content=current_code,
                test_suite_code=test_suite_code,
                error_feedback=error_feedback,
            )

            if not proposed_code.strip():
                print("[!] Developer Agent did not produce valid code. Full response:")
                print(explanation)
                print("Aborting attempt.")
                break

            print("\n" + "-" * 70)
            print(f"[CODE] PROPOSED CODE FOR {target_file}:")
            print("-" * 70)
            print(proposed_code)
            print("-" * 70)

            # Human Approval Gate 1: Code Application
            if not ask_user_approval(f"Apply this code to '{target_file}'?"):
                print("Code change rejected by user. Stopping workflow.")
                return

            # Write to workspace
            written_path = tools.write_workspace_file(target_file, proposed_code)
            print(f"[+] Successfully wrote changes to {written_path}")

            # Reviewer Agent Phase
            print(f"\n[Phase 3: Code Review] Reviewer Agent is auditing security & quality...")
            review_report = agents.run_reviewer_agent(
                target_file=target_file,
                proposed_code=proposed_code,
                plan=plan,
            )
            print("\n" + "-" * 70)
            print("[AUDIT] REVIEWER AGENT AUDIT REPORT:")
            print("-" * 70)
            print(review_report)
            print("-" * 70)

            # Human Approval Gate 2: Test Execution
            if not ask_user_approval("Run the automated pytest test suite now?"):
                print("Test execution skipped by user.")
                break

            # Tester Agent Phase
            print(f"\n[Phase 4: Testing] Tester Agent is executing pytest tests...")
            test_result = agents.run_tester_agent(timeout_seconds=15)

            print("\n" + "-" * 70)
            print(f"[TEST] TEST SUITE RESULT (Exit code: {test_result['exit_code']}):")
            print("-" * 70)
            if test_result["stdout"]:
                print(test_result["stdout"])
            if test_result["stderr"]:
                print(f"Errors:\n{test_result['stderr']}")
            print(f"Summary: {test_result['summary']}")
            print("-" * 70)

            if test_result["success"]:
                print(f"\n[SUCCESS] All tests passed on attempt {attempt}!")
                print("Autonomous development workflow completed successfully.")
                return
            else:
                print(f"\n[-] Tests FAILED on attempt {attempt}.")
                if attempt < MAX_REPAIR_ATTEMPTS:
                    print(f"Initiating auto-repair loop: sending failure diagnostics back to Developer Agent...")
                    # Assemble failure feedback for next developer attempt
                    error_feedback = (
                        f"STDOUT:\n{test_result['stdout']}\n"
                        f"STDERR:\n{test_result['stderr']}\n"
                        f"Exit code: {test_result['exit_code']}"
                    )
                    attempt += 1
                else:
                    print(f"\n[!] Reached maximum number of repair attempts ({MAX_REPAIR_ATTEMPTS}).")
                    print("Escalating to human developer for manual intervention.")
                    break

    except agents.GeminiServiceUnavailableError as exc:
        print(f"\n[!] Service Unavailable: {exc}")
        print("The Gemini model is currently experiencing high demand. Please try again in a few moments.\n")
        return
    except Exception as exc:
        err_str = str(exc)
        if "503" in err_str or "UNAVAILABLE" in err_str:
            print("\n[!] Service Unavailable: The Gemini model is currently experiencing high demand (503).")
            print("The team could not reach the server after retries. Please wait a few moments and try again.\n")
            return
        raise


if __name__ == "__main__":
    cli_arg = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else ""
    run_orchestrator(cli_arg)

