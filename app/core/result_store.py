"""
In-memory conversion result store with TTL.
Used as a short-term fallback for ephemeral filesystems.
"""

import time
from dataclasses import dataclass
from threading import Lock
from typing import Optional


@dataclass
class ResultEntry:
    content: bytes
    filename: str
    content_type: str
    expires_at: float


_STORE: dict[str, ResultEntry] = {}
_LOCK = Lock()
DEFAULT_TTL_SECONDS = 3600


def put(
    file_id: str,
    content: bytes,
    filename: str,
    content_type: str = "application/octet-stream",
    ttl_seconds: int = DEFAULT_TTL_SECONDS,
) -> None:
    now = time.time()
    with _LOCK:
        cleanup(now)
        _STORE[file_id] = ResultEntry(
            content=content,
            filename=filename,
            content_type=content_type,
            expires_at=now + max(1, ttl_seconds),
        )


def get(file_id: str) -> Optional[ResultEntry]:
    now = time.time()
    with _LOCK:
        entry = _STORE.get(file_id)
        if not entry:
            return None
        if entry.expires_at <= now:
            _STORE.pop(file_id, None)
            return None
        return entry


def cleanup(now: Optional[float] = None) -> None:
    ts = now if now is not None else time.time()
    expired_keys = [key for key, value in _STORE.items() if value.expires_at <= ts]
    for key in expired_keys:
        _STORE.pop(key, None)
