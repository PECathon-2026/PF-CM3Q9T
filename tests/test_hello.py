"""Pytest test suite for workspace.hello."""
import sys
from pathlib import Path

WORKSPACE_DIR = Path(__file__).resolve().parent.parent / "workspace"
if str(WORKSPACE_DIR) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_DIR))

from hello import greet


def test_greet_standard_name():
    assert greet("Alice") == "Hello, Alice!"


def test_greet_with_whitespace():
    assert greet("  Bob  ") == "Hello, Bob!"


def test_greet_empty_name():
    assert greet("") == "Hello, Stranger!"


def test_greet_none_or_spaces():
    assert greet("   ") == "Hello, Stranger!"
