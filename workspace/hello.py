"""Sample module for PS-001 autonomous software development team workspace."""


def greet(name: str) -> str:
    """Return a greeting message for the given name."""
    if not name or not name.strip():
        return "Hello, Stranger!"
    return f"Hello, {name.strip()}!"
