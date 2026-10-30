"""tests/test_server.py - Tests for PS-001 ASGI Server Endpoints."""

import pytest
from starlette.testclient import TestClient

from server import app


@pytest.fixture
def client():
    return TestClient(app)


def test_api_status_endpoint(client):
    """Verify that /api/status returns model, sandbox, and readiness without exposing keys."""
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "model" in data
    assert "gemini" in data["model"]
    assert "sandbox" in data
    # Ensure API key itself is never exposed
    assert "api_key" not in data
    assert "GEMINI_API_KEY" not in data


def test_api_list_files(client):
    """Verify that /api/files lists workspace and test files."""
    response = client.get("/api/files")
    assert response.status_code == 200
    data = response.json()
    assert "workspace" in data
    assert "tests" in data
    assert "workspace/hello.py" in data["workspace"]
    assert "tests/test_hello.py" in data["tests"]


def test_api_get_file_valid(client):
    """Verify safe retrieval of allowed files."""
    response = client.get("/api/file?path=workspace/hello.py")
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert len(data["content"]) > 0


def test_api_get_file_path_traversal_blocked(client):
    """Verify path traversal attacks are rejected with status 403."""
    response = client.get("/api/file?path=../server.py")
    assert response.status_code == 403
    data = response.json()
    assert "Security Violation" in data["error"]


def test_api_test_execution(client):
    """Verify real pytest execution through /api/test endpoint on workspace tests."""
    response = client.post("/api/test", json={"test_target": "tests/test_hello.py"})
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert data["success"] is True
    assert data["exit_code"] == 0
    assert "passed" in data["stdout"]
    assert "test_cases" in data
    assert isinstance(data["test_cases"], list)
    assert data["total"] >= 4
    assert data["passed_count"] >= 4
    assert data["failed_count"] == 0
    # Verify structure of individual test case items
    first_case = data["test_cases"][0]
    assert "file" in first_case
    assert "name" in first_case
    assert first_case["status"] == "PASSED"


def test_parse_pytest_output_logic():
    """Verify parse_pytest_output correctly separates passed, failed, and skipped cases."""
    from tools import parse_pytest_output

    sample_output = """
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.2.0, pluggy-1.7.0
rootdir: C:\\Users\\Acer\\Documents\\PS-001
collected 3 items

tests/test_sample.py::test_pass PASSED                     [ 33%]
tests/test_sample.py::test_fail FAILED                     [ 66%]
tests/test_sample.py::test_skip SKIPPED                    [100%]

================================== FAILURES ===================================
__________________________________ test_fail __________________________________

    def test_fail():
>       assert 1 == 2
E       AssertionError: assert 1 == 2

tests/test_sample.py:10: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_sample.py::test_fail - AssertionError: assert 1 == 2
================== 1 failed, 1 passed, 1 skipped in 0.20s ===================
"""
    parsed = parse_pytest_output(sample_output, exit_code=1)
    assert parsed["total"] == 3
    assert parsed["passed_count"] == 1
    assert parsed["failed_count"] == 1
    assert parsed["skipped_count"] == 1
    cases = {c["name"]: c for c in parsed["test_cases"]}
    assert cases["test_pass"]["status"] == "PASSED"
    assert cases["test_fail"]["status"] == "FAILED"
    assert "AssertionError: assert 1 == 2" in cases["test_fail"]["error"]
    assert cases["test_skip"]["status"] == "SKIPPED"


def test_api_apply_security_jail(client):
    """Verify that file writes outside workspace/ are rejected."""
    response = client.post(
        "/api/apply",
        json={"target_file": "../malicious.py", "content": "print('fail')"},
    )
    assert response.status_code == 403


def test_api_download_zip_archive(client):
    """Verify that /api/download/zip returns a valid zip file containing workspace files."""
    response = client.get("/api/download/zip")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert "ps001_project.zip" in response.headers.get("content-disposition", "")
    assert len(response.content) > 0


def test_api_project_new_endpoint(client):
    """Verify that /api/project/new initializes workspace and returns file list."""
    response = client.post("/api/project/new")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "workspace/hello.py" in data["files"]
